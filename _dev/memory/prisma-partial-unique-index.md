# Prisma + PostgreSQL: Partial Unique Index için Raw SQL Şart

**Bağlam:** Soft-delete deseninde "aynı anda yalnızca bir aktif satır" invariant'ı (örn. `endedAt IS NULL`, `deletedAt IS NULL`, `archivedAt IS NULL`) DB seviyesinde nasıl zorlanır?

**Tuzak:** Prisma DSL'de `@@unique([colA, colB, nullableTimestamp])` yazılırsa Prisma bunu standart `CREATE UNIQUE INDEX` olarak üretir. PostgreSQL'de NULL semantiği uyarınca **NULL ≠ NULL** — bu yüzden `(t1, m1, NULL)` ve `(t2, m1, NULL)` iki satırı unique constraint için "farklı" sayılır. **Aktif çoklu satır engellenmez.** Sessiz başarısızlık: schema yazılıdır ama invariant tutmaz.

**Çözüm — raw SQL partial unique index:**

```sql
CREATE UNIQUE INDEX "Table_col_active_unique"
  ON "Table" ("col")
  WHERE "endedAt" IS NULL;
```

`WHERE` klozu yalnızca aktif satırları index'e alır — her `col` değeri için tek aktif satıra izin verir, race-safe + atomic.

**Uygulama deseni (TASK-1.13'te kullanıldı):**

1. Prisma schema'da `@@unique([..., endedAt])` **YAZMA** — yanıltıcı olur.
2. Schema'ya yalnızca `@@index([col, endedAt])` (sorgu performansı için) ekle.
3. `prisma migrate dev --create-only --name <desc>` ile migration üret (apply etmeden).
4. Üretilen `migration.sql`'in **sonuna** raw SQL `CREATE UNIQUE INDEX ... WHERE ...` ekle.
5. `prisma migrate dev` ile uygula. `migrate deploy` tüm ortamlarda otomatik çalıştırır.
6. Integration test yaz: aynı `col` için iki aktif (`endedAt: null`) satır oluşturmayı dene → DB rejekte etmeli. Bu test partial index'in migration'da deploy garantisini de yakalar (raw SQL atlanırsa test FAIL).

**Ne zaman uygulanır:** Aktif/sonlanmış soft-delete patternı taşıyan herhangi bir ilişki/satır:
- TASK-1.13 `TrainerMember` (memberId için tek aktif PT)
- TASK-1.13 `GymOwnerTrainer` (trainerId için tek aktif gym owner)
- (Olasılık) İleride: `Subscription` (userId için tek aktif abonelik), `Session` (deviceId için tek aktif oturum), `Invite` (memberPhone için tek aktif bekleyen davet), vb.

**Çapraz referans:** [[kvkk-pii-scrubbing-matrisi]] yeni schema alanı eklendiğinde PII_FIELDS güncelleme disiplini ile bu disiplin paralel çalışır — schema değişikliği task'ında her ikisi de kontrol edilir.
