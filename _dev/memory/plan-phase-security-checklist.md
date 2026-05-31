# Plan Phase Güvenlik Checklist — Yeni Backend Route

Faz 2'de (TASK-2.16) `completeWorkout` ownership, `publishProgram` status guard, `patchProgram` soft-delete exercise kontrolü **verify-phase'de** yakalandı. Plan aşamasında eklenmemiş olsaydı güvenlik açığı prod'a gidecekti.

**Kural:** Plan phase'de her yeni backend route/endpoint için task kabul kriterlerine şu soruları ekle:

1. **Ownership:** Talep eden kullanıcı bu kaynağa sahip mi? (trainer → kendi programı, member → kendi tamamlaması)
2. **Role guard:** Sadece izin verilen rol çağırabilmeli mi? (`ensureTrainer`, role: 'member' check)
3. **Status guard:** Kaynağın mevcut durumu bu operasyona izin veriyor mu? (draft → active geçişi, arşivlenmiş kayıt değiştirilemez)
4. **Soft-delete guard:** Silinmiş kayıtlar referans alınabiliyor mu? (soft-delete exercise → patchProgram'da invalid)
5. **Input bounding:** Sayısal parametre NaN/overflow'a açık mı? (limit=abc → safeLimit ile bound)

**Kanca — ne zaman uygulanır:** Plan phase'de task kabul kriterleri yazılırken, yeni endpoint'lerin "Test Edilecekler" listesine bu 5 soru eklenir.

**Neden:** Faz 2 verify-phase'de 3 orta-düzey güvenlik bulgusu ortaya çıktı (TASK-2.16). Plan aşamasında kontrol edilseydi ayrı task açılmazdı.
