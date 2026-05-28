#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DevFlow — Audit Canvas (rolling audit kuyruğu)

Bir DevFlow projesinin dokümanlarını (kök CLAUDE.md + _dev/**/*.md) izleyen,
SQLite tabanlı bir "kontrol kuyruğu" yönetir. Asıl kaynak _dev/'in kendisidir;
bu canvas yalnızca "hangi doküman ne zaman / hangi konvansiyon versiyonuna göre
kontrol edildi" durumunu tutan, yeniden üretilebilir bir cursor'dır.

- Store: _dev/.audit/canvas.db   (SQLite; gitignore'lı, yerel)
- Ayna:  _dev/.audit/canvas.tsv  (git-tracked; her yazımda deterministik üretilir;
         canvas.db kaybolursa buradan rebuild edilir)

Bu script dokümanları ASLA değiştirmez (READ-ONLY). Yalnızca .audit/ altına ve
(ilk kurulumda) kök .gitignore'a yazar. Tüm düzeltmeler Claude + kullanıcı onayı
üzerinden yapılır; script sadece tarar, seçer, durumu tutar.

Bağımlılık: yalnızca python3 stdlib (sqlite3 + hashlib) — sqlite3 CLI gerekmez.

Komutlar:
  reconcile            _dev/ + CLAUDE.md tara; yeni dokümanı ekle, silineni çıkar
  scan                 mekanik acil tespit (boyut red-line) → status=urgent
  next [--limit N]     sıradaki kontrol edilecek doküman(lar)ı gerekçeyle döndür
       [--rotate]      güncel/uygun dokümanları da en-eskiden rotasyona kat
  touch <path>         dokümanı "kontrol edildi" işaretle (--status, vars. conformant)
  invalidate (--filter GLOB | --all)   eşleşenleri yeniden kuyruğa al (biri zorunlu)
  bump-version         konvansiyon versiyonunu artır (eski-versiyonlu herkes due olur)
  exclude <path>       dokümanı kalıcı kapsam-dışı yap
  include <path>       kapsam-dışı işaretini kaldır
  status               özet
"""

import argparse
import datetime
import fnmatch
import hashlib
import os
import sqlite3
import sys

CANVAS_REL_DIR = os.path.join("_dev", ".audit")
DB_NAME = "canvas.db"
MIRROR_NAME = "canvas.tsv"

# Boyut eşiği — doc-scan.sh ile AYNI tutulmalı (değişirse ikisini de güncelle).
TOKEN_HARD = int(os.environ.get("TOKEN_HARD", "20000"))

DEFAULT_CONVENTION_VERSION = "1"
SCHEMA_VERSION = "1"

MIRROR_COLUMNS = ["id", "path", "status", "status_reason", "checked_version",
                  "last_checked", "content_hash", "exclude", "added_at"]

# `next` öncelik katmanları — path-based, statik (DevFlow yapısı sabit yollar kullanır).
# Aynı bucket'ta (urgent / conformance / rotation) düşük tier önce gider.
#   Tier 1 = çekirdek yaşayan dokümanlar (her oturum okunur, blast radius geniş)
#   Tier 3 = tarihsel/sistem (audit'in işi minimal — içerik-koruyan reformat)
#   Tier 2 = kalan her şey (modüller, memory atomları, aktif task, faz, PRD, docs/*)
#
# NOT — `_dev/phases/PHASE-N.md` her zaman Tier 2 kalır (path-static): tamamlanmış
# (✅) fazlar CLAUDE-MD'de "tarihsel" sayılır ama bunu bilmek PHASES.md parse
# etmeyi gerektirir; script tasarımı READ-ONLY ve format-agnostik tutmak için
# path-static. Yargı (✅ mı?) ve uygun ele alış (içerik-koruyan reformat) Claude'a
# bırakılır — audit-conform.md Adım 5 bunu doğru ele alır. Sonuç: tamamlanmış faz
# dokümanı yüksek öncelikle (Tier 2) gelebilir ama davranış yine doğrudur.
TIER1_DOCS = {
    "CLAUDE.md",
    "_dev/OVERVIEW.md",
    "_dev/DURUM.md",
    "_dev/INDEX.md",
    "_dev/MODULE-MAP.md",
    "_dev/PHASES.md",
    "_dev/QUALITY.md",
    "_dev/ILKELER.md",
    "_dev/MEMORY.md",
}
TIER3_DOCS = {
    "_dev/tasks/TASKS-README.md",
    "_dev/docs/DECISIONS.md",
}
TIER3_PREFIXES = ("_dev/tasks/archive/",)


def tier_for(path):
    """Statik path-temelli öncelik bucket'ı (1=çekirdek, 2=normal, 3=tarihsel/sistem)."""
    if path in TIER1_DOCS:
        return 1
    if path in TIER3_DOCS:
        return 3
    for prefix in TIER3_PREFIXES:
        if path.startswith(prefix):
            return 3
    return 2


def today():
    return datetime.date.today().isoformat()


def norm(rel):
    return rel.replace(os.sep, "/")


def db_path(root):
    return os.path.join(root, CANVAS_REL_DIR, DB_NAME)


def mirror_path(root):
    return os.path.join(root, CANVAS_REL_DIR, MIRROR_NAME)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def iter_doc_paths(root):
    """İzlenecek doküman seti: kök CLAUDE.md + _dev/**/*.md (.audit/ hariç)."""
    paths = []
    if os.path.isfile(os.path.join(root, "CLAUDE.md")):
        paths.append("CLAUDE.md")
    dev = os.path.join(root, "_dev")
    audit_abs = os.path.abspath(os.path.join(root, CANVAS_REL_DIR))
    if os.path.isdir(dev):
        for dirpath, dirnames, filenames in os.walk(dev):
            # .audit/ alt ağacına inme (kendi artifact'larımız)
            dirnames[:] = [d for d in dirnames
                           if os.path.abspath(os.path.join(dirpath, d)) != audit_abs]
            for fn in filenames:
                if fn.endswith(".md"):
                    rel = os.path.relpath(os.path.join(dirpath, fn), root)
                    paths.append(norm(rel))
    return sorted(set(paths))


def init_schema(conn):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS docs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            path            TEXT UNIQUE NOT NULL,
            status          TEXT NOT NULL DEFAULT 'pending',
            status_reason   TEXT,
            checked_version INTEGER,
            last_checked    TEXT,
            content_hash    TEXT,
            exclude         INTEGER NOT NULL DEFAULT 0,
            added_at        TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS meta (
            key   TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    conn.execute("INSERT OR IGNORE INTO meta(key,value) VALUES('current_convention_version',?)",
                 (DEFAULT_CONVENTION_VERSION,))
    conn.execute("INSERT OR IGNORE INTO meta(key,value) VALUES('schema_version',?)",
                 (SCHEMA_VERSION,))
    conn.commit()


def get_meta(conn, key, default=None):
    r = conn.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
    return r[0] if r else default


def current_version(conn):
    return int(get_meta(conn, "current_convention_version", DEFAULT_CONVENTION_VERSION))


def ensure_gitignore(root):
    """canvas.db (ve yan dosyaları) git'e girmesin; ayna canvas.tsv izlenir."""
    gip = os.path.join(root, ".gitignore")
    needed = ["_dev/.audit/canvas.db", "_dev/.audit/canvas.db-*"]
    existing = []
    if os.path.exists(gip):
        with open(gip, "r", encoding="utf-8") as f:
            existing = [l.rstrip("\n") for l in f]
    missing = [e for e in needed if e not in existing]
    if missing:
        with open(gip, "a", encoding="utf-8") as f:
            if existing and existing[-1].strip() != "":
                f.write("\n")
            f.write("# DevFlow audit canvas (yerel SQLite — git'e girmez; ayna canvas.tsv izlenir)\n")
            for e in missing:
                f.write(e + "\n")


_CONFLICT_MSG = (
    "hata: %s git-conflict marker içeriyor%s.\n"
    "Çözüm: marker'ları elle temizleyip her iki tarafın en güncel\n"
    "kaydını koru (daha yeni last_checked kazanır; aynı günse\n"
    "daha büyük checked_version), sonra `reconcile` çağır.\n"
    "Detay: README → 'Doküman Denetimi' → canvas.tsv merge conflict."
)


def validate_mirror(path):
    """Pre-flight conflict-marker kontrolü: sqlite3.connect() çağrılmadan ÖNCE
    çalıştırılır. Mirror bozuksa SystemExit; aksi halde sqlite3.connect() boş
    bir canvas.db yaratır, import_mirror içindeki guard SystemExit eder ama
    yan-etki olarak diskte boş db kalır → sonraki çağrı rebuild'i atlatır →
    canvas state sessizce kaybolur."""
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            if line.startswith(("<<<<<<<", "=======", ">>>>>>>")):
                raise SystemExit(_CONFLICT_MSG % (path, " (satır %d)" % i))


def import_mirror(conn, path):
    """canvas.db yoksa, git-tracked aynadan (canvas.tsv) durumu geri yükle.
    Conflict guard burada da var — savunma derinliği için; pratikte
    connect() içinden validate_mirror önce çağrıldığı için tetiklenmez."""
    meta = {}
    header = None
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if line.startswith(("<<<<<<<", "=======", ">>>>>>>")):
                raise SystemExit(_CONFLICT_MSG % (path, ""))
            if line.startswith("# meta:"):
                for pair in line[len("# meta:"):].split(";"):
                    if "=" in pair:
                        k, v = pair.split("=", 1)
                        meta[k.strip()] = v.strip()
                continue
            if line.startswith("#") or line == "":
                continue
            if header is None:
                header = line.split("\t")
                continue
            data.append(line.split("\t"))
    for k, v in meta.items():
        conn.execute("INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)", (k, v))
    for fields in data:
        rec = dict(zip(header, fields))

        def val(k):
            v = rec.get(k, "")
            return None if v == "" else v

        conn.execute(
            "INSERT OR REPLACE INTO docs(id,path,status,status_reason,checked_version,"
            "last_checked,content_hash,exclude,added_at) VALUES(?,?,?,?,?,?,?,?,?)",
            (int(rec["id"]) if rec.get("id") else None,
             rec["path"],
             rec.get("status") or "pending",
             val("status_reason"),
             int(rec["checked_version"]) if val("checked_version") else None,
             val("last_checked"),
             val("content_hash"),
             int(rec.get("exclude") or 0),
             rec.get("added_at") or today()))
    conn.commit()


def write_mirror(conn, root):
    rows = conn.execute(
        "SELECT id,path,status,status_reason,checked_version,last_checked,"
        "content_hash,exclude,added_at FROM docs ORDER BY path").fetchall()
    cv = current_version(conn)
    sv = get_meta(conn, "schema_version", SCHEMA_VERSION)
    lines = [
        "# DevFlow audit canvas — otomatik üretildi (kaynak: canvas.db). Elle düzenleme.",
        "# meta: current_convention_version=%d; schema_version=%s" % (cv, sv),
        "\t".join(MIRROR_COLUMNS),
    ]
    for r in rows:
        lines.append("\t".join("" if v is None else str(v) for v in r))
    with open(mirror_path(root), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def connect(root):
    """DB'yi aç; yoksa ve ayna varsa aynadan rebuild et; şemayı garanti et."""
    os.makedirs(os.path.join(root, CANVAS_REL_DIR), exist_ok=True)
    dbp = db_path(root)
    mp = mirror_path(root)
    rebuilt = not os.path.exists(dbp) and os.path.exists(mp)
    if rebuilt:
        # sqlite3.connect() çağrılmadan önce: hata atılırsa diskte boş db
        # kalmamalı (kalırsa sonraki çağrıda rebuilt=False → import_mirror
        # atlanır → veri kaybı).
        validate_mirror(mp)
    conn = sqlite3.connect(dbp)
    init_schema(conn)
    if rebuilt:
        import_mirror(conn, mp)
        sys.stderr.write("not: canvas.db yoktu, canvas.tsv aynasından yeniden oluşturuldu.\n")
    ensure_gitignore(root)
    return conn


# ----------------------------- komutlar -----------------------------

def cmd_reconcile(conn, root, args):
    disk = set(iter_doc_paths(root))
    dbset = set(r[0] for r in conn.execute("SELECT path FROM docs").fetchall())
    added = sorted(disk - dbset)
    removed = sorted(dbset - disk)
    for p in added:
        conn.execute("INSERT INTO docs(path,status,added_at) VALUES(?,?,?)",
                     (p, "pending", today()))
    for p in removed:
        conn.execute("DELETE FROM docs WHERE path=?", (p,))
    conn.commit()
    write_mirror(conn, root)
    print("reconcile: +%d yeni, -%d silinen, toplam %d doküman"
          % (len(added), len(removed), len(disk)))
    for p in added:
        print("  + " + p)
    for p in removed:
        print("  - " + p)


def cmd_scan(conn, root, args):
    rows = conn.execute(
        "SELECT path,status,status_reason FROM docs WHERE exclude=0").fetchall()
    became, cleared = [], []
    for path, status, reason in rows:
        full = os.path.join(root, path)
        if not os.path.isfile(full):
            continue
        try:
            chars = len(open(full, encoding="utf-8", errors="replace").read())
        except OSError:
            continue
        esttok = chars * 10 // 35  # doc-scan.sh ile aynı kaba tahmin (~char/3.5)
        if esttok > TOKEN_HARD:
            if status != "urgent":
                became.append(path)
            conn.execute("UPDATE docs SET status='urgent', status_reason=? WHERE path=?",
                         ("urgent:token-hard", path))
        elif status == "urgent" and (reason or "").startswith("urgent:token-hard"):
            cleared.append(path)
            conn.execute("UPDATE docs SET status='pending', status_reason=NULL WHERE path=?",
                         (path,))
    conn.commit()
    write_mirror(conn, root)
    print("scan: %d acil (boyut) işaretlendi, %d temizlendi (eşik ~%d token)"
          % (len(became), len(cleared), TOKEN_HARD))
    for p in became:
        print("  ! " + p)


def cmd_next(conn, root, args):
    cv = current_version(conn)
    rows = conn.execute(
        "SELECT path,status,status_reason,checked_version,content_hash,last_checked "
        "FROM docs WHERE exclude=0").fetchall()
    cand = []  # (öncelik, tier, last_checked, path, gerekçe)
    for path, status, reason, cver, chash, lchecked in rows:
        full = os.path.join(root, path)
        if not os.path.isfile(full):
            continue
        t = tier_for(path)
        if status == "urgent":
            cand.append((0, t, lchecked or "", path, reason or "urgent"))
            continue
        cur_hash = sha256_file(full)
        if cver is None:
            cand.append((1, t, lchecked or "", path, "conformance:never"))
        elif int(cver) < cv:
            cand.append((1, t, lchecked or "", path, "conformance:version-outdated"))
        elif chash != cur_hash:
            cand.append((1, t, lchecked or "", path, "conformance:changed"))
        elif args.rotate and (lchecked or "") < today():
            # Rotasyona aynı gün re-touch'lanan dokümanları katma — yoksa
            # tier-first sort + günlük tarih granülasyonu yüksek-tier dokümanı
            # sürekli yeniden seçer, alt tier'lar starvation'a uğrar.
            # Bu skip ile rotasyon doğal bir günlük döngüye dönüşür.
            cand.append((2, t, lchecked or "", path, "rotation:oldest"))
    cand.sort(key=lambda c: (c[0], c[1], c[2], c[3]))
    if not cand:
        print("# kuyrukta hazır doküman yok (her şey güncel konvansiyona uygun)")
        return
    for _prio, _tier, _lc, path, reason in cand[:args.limit]:
        print("%s\t%s" % (path, reason))


def cmd_touch(conn, root, args):
    path = norm(args.path)
    if not conn.execute("SELECT 1 FROM docs WHERE path=?", (path,)).fetchone():
        sys.stderr.write("hata: '%s' canvas'ta yok (önce reconcile?)\n" % path)
        sys.exit(1)
    full = os.path.join(root, path)
    chash = sha256_file(full) if os.path.isfile(full) else None
    conn.execute(
        "UPDATE docs SET last_checked=?, checked_version=?, content_hash=?, "
        "status=?, status_reason=NULL WHERE path=?",
        (today(), current_version(conn), chash, args.status, path))
    conn.commit()
    write_mirror(conn, root)
    print("touch: %s → %s (v%d, %s)" % (path, args.status, current_version(conn), today()))


def cmd_invalidate(conn, root, args):
    # Filtreyi belirle: --all veya --filter GLOB (biri zorunlu — yanlışlıkla tüm
    # canvas'ı vuran çıplak `invalidate` çağrısını engellemek için).
    flt = "*" if args.all else args.filter
    hit = [p for (p,) in conn.execute("SELECT path FROM docs").fetchall()
           if fnmatch.fnmatch(p, flt)]
    for p in hit:
        # status='pending' de eklenir: salt checked_version=NULL bırakırsak
        # eski 'conformant' status sütunda kalır → `status` raporu yanıltıcı
        # ("conformant" gösterir ama `next` aynı dokümanı `conformance:never`
        # döner). 'urgent' bayraklılar urgent kalır — mekanik acil bağımsız.
        conn.execute(
            "UPDATE docs SET checked_version=NULL, "
            "status=CASE WHEN status='urgent' THEN status ELSE 'pending' END, "
            "status_reason=CASE WHEN status='urgent' THEN status_reason ELSE NULL END "
            "WHERE path=?", (p,))
    conn.commit()
    write_mirror(conn, root)
    print("invalidate: %d doküman yeniden kuyruğa alındı (filtre: %s)" % (len(hit), flt))


def cmd_bump_version(conn, root, args):
    nv = current_version(conn) + 1
    conn.execute("UPDATE meta SET value=? WHERE key='current_convention_version'", (str(nv),))
    conn.commit()
    write_mirror(conn, root)
    print("bump-version: konvansiyon versiyonu → %d (eski-versiyonlu tüm dokümanlar artık due)" % nv)


def cmd_set_exclude(conn, root, args, value):
    path = norm(args.path)
    n = conn.execute("UPDATE docs SET exclude=? WHERE path=?", (value, path)).rowcount
    conn.commit()
    if not n:
        sys.stderr.write("hata: '%s' canvas'ta yok\n" % path)
        sys.exit(1)
    write_mirror(conn, root)
    print("%s: %s" % ("include" if value == 0 else "exclude", path))


def cmd_status(conn, root, args):
    print("Konvansiyon versiyonu: %d" % current_version(conn))
    print("Toplam doküman: %d" % conn.execute("SELECT COUNT(*) FROM docs").fetchone()[0])
    for status, n in conn.execute(
            "SELECT status, COUNT(*) FROM docs GROUP BY status ORDER BY status"):
        print("  %-12s %d" % (status, n))
    print("  excluded     %d" % conn.execute(
        "SELECT COUNT(*) FROM docs WHERE exclude=1").fetchone()[0])


def main():
    ap = argparse.ArgumentParser(description="DevFlow audit canvas (rolling audit kuyruğu)")
    ap.add_argument("--root", default=os.getcwd(), help="proje kökü (varsayılan: cwd)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("reconcile", help="doküman listesini gerçekle uzlaştır")
    sub.add_parser("scan", help="mekanik acil tespit (boyut)")
    p = sub.add_parser("next", help="sıradaki doküman(lar)")
    p.add_argument("--limit", type=int, default=1)
    p.add_argument("--rotate", action="store_true", help="uygun dokümanları da rotasyona kat")
    p = sub.add_parser("touch", help="dokümanı kontrol edildi işaretle")
    p.add_argument("path")
    p.add_argument("--status", default="conformant")
    p = sub.add_parser("invalidate", help="yeniden kuyruğa al (--filter veya --all zorunlu)")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--filter", help="fnmatch GLOB pattern (örn. '_dev/modules/*')")
    g.add_argument("--all", action="store_true", help="TÜM dokümanları yeniden kuyruğa al")
    sub.add_parser("bump-version", help="konvansiyon versiyonunu artır")
    p = sub.add_parser("exclude", help="kalıcı kapsam-dışı")
    p.add_argument("path")
    p = sub.add_parser("include", help="kapsam-dışı işaretini kaldır")
    p.add_argument("path")
    sub.add_parser("status", help="özet")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    conn = connect(root)
    try:
        if args.cmd == "reconcile":
            cmd_reconcile(conn, root, args)
        elif args.cmd == "scan":
            cmd_scan(conn, root, args)
        elif args.cmd == "next":
            cmd_next(conn, root, args)
        elif args.cmd == "touch":
            cmd_touch(conn, root, args)
        elif args.cmd == "invalidate":
            cmd_invalidate(conn, root, args)
        elif args.cmd == "bump-version":
            cmd_bump_version(conn, root, args)
        elif args.cmd == "exclude":
            cmd_set_exclude(conn, root, args, 1)
        elif args.cmd == "include":
            cmd_set_exclude(conn, root, args, 0)
        elif args.cmd == "status":
            cmd_status(conn, root, args)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
