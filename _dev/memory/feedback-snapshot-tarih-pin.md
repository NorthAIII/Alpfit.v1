# Süreç Disiplini: UI Snapshot Testleri Tarih-Bağımsız Olmalı

Tarih veya zaman çıktısı içeren UI component'lerinin snapshot testlerinde **sistem saatini fake timer ile pin'le**; aksi halde snapshot ertesi gün CI'ı kırar.

## Why

TASK-1.15 oturumunda (2026-05-30) yakalandı: mobile `landing-screen.test.tsx` snapshot'ı `formatTrDate(new Date())` çıktısını **kelimesi kelimesine** sabitliyordu ("29 Mayıs 2026"). Bir gün sonra `new Date()` "30 Mayıs 2026" üretti → snapshot mismatch → CI fail. Bu test smell **TASK-1.15 kapsamı dışında** ortaya çıktı ama her sabah CI'ı kıracak bir time bomb'du.

Genel sebep: `toMatchSnapshot()` çıktıyı **tam string** olarak gömer. Component içinde herhangi bir non-deterministik değer (tarih, saat, random ID, performance.now) varsa snapshot drift garanti.

## How to apply

UI snapshot testi yazarken:

1. **Component tarih/saat üretiyor mu?** (`formatTrDate(new Date())`, `Date.now()`, `Math.random()`, herhangi bir non-deterministik kaynak)
2. **Evet → snapshot test'inde fake timer ile pin'le:**
   ```ts
   const PINNED_NOW = new Date('2026-05-29T12:00:00Z');

   beforeAll(() => jest.useFakeTimers().setSystemTime(PINNED_NOW));
   afterAll(() => jest.useRealTimers());
   ```
   - 12:00 UTC seç (gece yarısı sınırından uzak; Europe/Istanbul UTC+3 → 15:00 TR, aynı takvim günü garanti).
   - `beforeAll`/`afterAll` test izolasyonu için zorunlu (diğer test dosyalarına sızmasın).
3. **Hayır → toMatchSnapshot güvenli.**
4. **Snapshot dışı assertion** (`getByText(/regex pattern/)`) tarih-değişimine duyarsız → tercih edilir; snapshot yalnızca **refactor güvencesi** olarak ek katman.

Sınır: backend testlerinde bu sorun yok (Vitest test'leri zaten DB state'i pin'leniyor). Sadece **mobile + UI snapshot** desenidir.

## Önleyici kontrol

Faz review'ında yeni snapshot dosyaları tarih/saat string'i içeriyor mu kontrol et:

```bash
grep -rE '(Mayıs|Ocak|Şubat|Mart|Nisan|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)' \
  mobile/__tests__/__snapshots__/
```

Bulgu varsa → ya snapshot'tan tarihi kaldır (component testini regex ile yap), ya fake-timer ile pin'le.
