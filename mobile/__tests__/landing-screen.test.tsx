import LandingScreen from '../app/index';
import { renderWithProviders } from '../test/render-with-providers';

describe('LandingScreen', () => {
  it("TR landing greeting + bugünün tarihi prefix'i render eder", () => {
    const { getByText } = renderWithProviders(<LandingScreen />);
    expect(getByText('Merhaba Alpfit')).toBeOnTheScreen();
    // landing.todayPrefix interpolation: TR tarih formatı + " · " ile başlar.
    // formatTrDate(new Date()) bugünün tarihini "29 Mayıs 2026" formatında verir;
    // tam string'i sabitlemek test'in date-değişimine duyarlı olmasına yol açar —
    // intl/TZ'den bağımsız "Rol seçimi" kuyruğunu kontrol etmek yeterli.
    expect(getByText(/Rol seçimi TASK-1\.26'da gelecek\./)).toBeOnTheScreen();
  });

  it('snapshot eşleşir (refactor güvencesi)', () => {
    const tree = renderWithProviders(<LandingScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
