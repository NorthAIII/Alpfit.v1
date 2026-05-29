import LandingScreen from '../app/index';
import { renderWithProviders } from '../test/render-with-providers';

// Snapshot içeriği `formatTrDate(new Date())` çıktısını taşıyor — sistem
// tarihi değiştikçe snapshot drift'i (TASK-1.15 oturumunda yakalandı:
// "29 Mayıs 2026" → "30 Mayıs 2026"). Fake-timer ile sabit bir gün
// (2026-05-29 12:00 UTC) pinleniyor; böylece snapshot deterministik kalır,
// yarın CI yeşildir. Europe/Istanbul UTC+3 olduğu için 12:00 UTC her zaman
// aynı takvim gününe denk gelir (gece yarısı sınırından uzak).
const PINNED_NOW = new Date('2026-05-29T12:00:00Z');

describe('LandingScreen', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(PINNED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("TR landing greeting + bugünün tarihi prefix'i render eder", () => {
    const { getByText } = renderWithProviders(<LandingScreen />);
    expect(getByText('Merhaba Alpfit')).toBeOnTheScreen();
    // landing.todayPrefix interpolation: TR tarih formatı + " · " ile başlar.
    // Pin'lenmiş tarih = 2026-05-29 → "29 Mayıs 2026"; ama full match yerine
    // intl/TZ'den bağımsız "Rol seçimi" kuyruğunu kontrol etmek yeterli.
    expect(getByText(/Rol seçimi TASK-1\.26'da gelecek\./)).toBeOnTheScreen();
  });

  it('snapshot eşleşir (refactor güvencesi)', () => {
    const tree = renderWithProviders(<LandingScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
