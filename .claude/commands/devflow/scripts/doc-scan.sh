#!/usr/bin/env bash
# DevFlow — Doküman tek-seferde-okunabilirlik analizörü
#
# Dokümanları OKUMADAN tarar; satır, karakter, token tahmini, en uzun satır ve
# uzun-satır sayısını raporlar, eşik aşanları BAYRAK sütununda işaretler.
# Amaç: bir dokümanın tek bir Read çağrısıyla (parçalı okumaya gerek kalmadan)
# okunabilir olup olmadığını mekanik olarak kestirmek.
#
# Kullanım:
#   doc-scan.sh <dosya> [<dosya> ...]      # verilen dosyaları tara
#   doc-scan.sh -d <dizin>                 # dizindeki tüm .md'leri tara (recursive)
#
# Eşikler (env değişkeniyle ayarlanır):
#   TOKEN_COMFORT (6000)   rahatlık bayrağı — bu üstü "böl/temizle değerlendir"
#   TOKEN_HARD    (20000)  kırmızı çizgi — tek-okuma riski (parçalı okuma gerekebilir)
#   LINE_FLAG     (400)    satır sayısı işaret fişeği (ikincil)
#   LONGLINE      (1500)   tek satır karakter işaret fişeği (ikincil; tablo/code/URL muaf)
#
# Not: token tahmini kabadır (char / 3.5). Amaç kesin token değil, müdahale
# gereken dokümanı tespit etmektir. Asıl sinyal token/toplam boyut; satır sayısı
# ve uzun-satır ikincildir — birkaç çok uzun satır bile tek-okumayı bozabilir.

set -euo pipefail

TOKEN_COMFORT=${TOKEN_COMFORT:-6000}
TOKEN_HARD=${TOKEN_HARD:-20000}
LINE_FLAG=${LINE_FLAG:-400}
LONGLINE=${LONGLINE:-1500}

# --- Dosya listesini topla ---
files=()
if [ "${1:-}" = "-d" ]; then
  [ -n "${2:-}" ] || { echo "kullanım: doc-scan.sh -d <dizin>" >&2; exit 2; }
  [ -d "$2" ] || { echo "dizin yok: $2" >&2; exit 2; }
  while IFS= read -r f; do files+=("$f"); done < <(find "$2" -type f -name '*.md' | sort)
else
  files=("$@")
fi
[ "${#files[@]}" -gt 0 ] || { echo "kullanım: doc-scan.sh <dosya...> | -d <dizin>" >&2; exit 2; }

# --- Başlık ---
printf '%-46s %6s %9s %7s %12s %6s  %s\n' \
  "DOSYA" "SATIR" "KARAKTER" "~TOKEN" "EN_UZUN" ">${LONGLINE}" "BAYRAK"
printf '%.0s-' $(seq 1 104); printf '\n'

# --- Satırları üret (diziye topla ki sayaçlar pipeline subshell'inde kaybolmasın) ---
rows=()
flagged=0
total=0
for f in "${files[@]}"; do
  [ -f "$f" ] && [ -r "$f" ] || continue
  total=$((total + 1))
  lines=$(wc -l < "$f" | tr -d ' ')
  chars=$(wc -m < "$f" | tr -d ' ')          # locale-aware karakter (UTF-8 Türkçe doğru)
  read -r maxlen maxat longn <<<"$(awk -v t="$LONGLINE" '
    { if (length($0) > m) { m = length($0); ma = NR } if (length($0) > t) l++ }
    END { print m + 0, ma + 0, l + 0 }' "$f")"
  esttok=$(( chars * 10 / 35 ))               # ~ char / 3.5

  flag=""
  if   (( esttok > TOKEN_HARD ));    then flag="${flag}TOKEN-SERT "
  elif (( esttok > TOKEN_COMFORT )); then flag="${flag}token-rahat "; fi
  if (( lines  > LINE_FLAG )); then flag="${flag}satır "; fi
  if (( maxlen > LONGLINE  )); then flag="${flag}uzun-satır(L${maxat}) "; fi
  [ -n "$flag" ] && flagged=$((flagged + 1))

  # token'ı sıralama anahtarı olarak başa koy (sonra cut ile düşür)
  rows+=("$(printf '%012d\t%-46s %6s %9s %7s %9s@L%-4s %6s  %s' \
    "$esttok" "$f" "$lines" "$chars" "$esttok" "$maxlen" "$maxat" "$longn" "$flag")")
done

# token'a göre azalan sırala, sıralama anahtarını düşür
[ "${#rows[@]}" -gt 0 ] && printf '%s\n' "${rows[@]}" | sort -rn | cut -f2-

# --- Özet ---
printf '%.0s-' $(seq 1 104); printf '\n'
printf '%d doküman tarandı, %d tanesi bayraklı (eşik: ~%d/%d token, %d satır, %d karakter/satır).\n' \
  "$total" "$flagged" "$TOKEN_COMFORT" "$TOKEN_HARD" "$LINE_FLAG" "$LONGLINE"
