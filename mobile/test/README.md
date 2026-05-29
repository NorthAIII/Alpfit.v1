# Mobile Test Altyapısı

Bu klasör mobile workspace'inin component test altyapısını taşır. **Jest + React
Native Testing Library (RTL)** üzerine kurulu, `jest-expo/ios` preset'iyle koşar.
E2E (Maestro) Yakın 5'te eklenecek; şu an kapsam component-level + i18n.

## Hızlı Kullanım

```ts
import { renderWithProviders } from '../test/render-with-providers';
import MyComponent from './MyComponent';

it('TR metni render eder', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Devam')).toBeOnTheScreen();
});
```

`renderWithProviders` i18n provider'ı bağlar — TR namespace bundle'ları otomatik
yüklü gelir. `t('common:actions.continue')` çağrısı `"Devam"` döner.

## i18n Pattern

Test'te i18n key'i değil, **render edilen TR metni** assert et:

✅ İyi:  `expect(getByText('Devam')).toBeOnTheScreen();`
❌ Kötü: `expect(getByText('actions.continue')).toBeOnTheScreen();`

Gerekçe: kullanıcı TR metni görür, key'i değil. Lokalizasyon değişirse test
şartı korunsun (sürdürülebilirlik motoru regression'larında erken yakala).

## Snapshot Policy

- **Kritik component'ler** (banner stack, motor karar UI, ölçüm formu) için
  snapshot — refactor güvencesi.
- **Sade/dinamik UI** için query-based assertion (`getByText`, `getByRole`).
- Snapshot'lar git'e commit edilir (`__snapshots__/`). "Snapshot updated"
  PR'larında sinyali bozmamak için sade UI'da snapshot'tan kaçınılır.

## MSW (HTTP Mock)

`test/msw/README.md` — backend çağrılarını mock'lamak için pattern.

## Tek Platform vs Multi-Platform

`jest.config.js` `jest-expo/ios` kullanır (hız). Platform-specific davranış test
edilecekse `jest-expo` universal preset'e geçilir (web/ios/android/node 4 kez
koşar). Şu anki UI'da gerek yok.

## Coverage

```bash
pnpm -F @alpfit/mobile run test:coverage
```

`coverage/lcov.info` üretir (gitignored). Coverage threshold şu an YOK —
review-phase'de karar verilecek.
