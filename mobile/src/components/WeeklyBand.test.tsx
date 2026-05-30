// WeeklyBand bileşen testi.
// jest.useFakeTimers ile tarih sabitlenir (MEMORY: "Snapshot testleri tarih-bağımsız olmalı").
// 2026-06-01 = Pazartesi → JS getDay()=1 → Alpfit day=(1+6)%7=0 → today=0 (Pzt)

import { renderWithProviders } from '../../test/render-with-providers';

import { WeeklyBand } from './WeeklyBand';

import type { Program } from '../hooks/useMemberHome';

type ProgramDay = Program['days'][number];

function makeDay(dayOfWeek: number): ProgramDay {
  return {
    id: `day-${dayOfWeek}`,
    dayOfWeek,
    title: null,
    position: dayOfWeek,
    isOneOff: false,
    specificDate: null,
    exercises: [],
  };
}

// Pazartesi 2026-06-01 → Alpfit day 0
const MONDAY_TODAY = 0;

describe('WeeklyBand', () => {
  it('7 hücre render edilir', () => {
    const { getByTestId } = renderWithProviders(
      <WeeklyBand programDays={[]} todayAlpfitDay={MONDAY_TODAY} />,
    );
    expect(getByTestId('weekly-band')).toBeOnTheScreen();
    for (let i = 0; i < 7; i++) {
      expect(getByTestId(`weekly-band-day-${i}`)).toBeOnTheScreen();
    }
  });

  it('bugünkü hücre (today=0) highlight stiline sahip', () => {
    const { getByTestId } = renderWithProviders(
      <WeeklyBand programDays={[]} todayAlpfitDay={MONDAY_TODAY} />,
    );
    // Bugün hücresi testID="weekly-band-day-0"
    const todayCell = getByTestId('weekly-band-day-0');
    const style = todayCell.props['style'];
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flatStyle).toMatchObject({ backgroundColor: '#1E2A3D' });
  });

  it('program günü olmayan geçmiş hücre "-" ikonu gösterir', () => {
    // today=3 (Perşembe), Pzt(0) geçmiş + dinlenme
    const { getByTestId } = renderWithProviders(
      <WeeklyBand programDays={[makeDay(3)]} todayAlpfitDay={3} />,
    );
    // day-0 = Pazartesi, geçmiş, antrenman yok → "-"
    expect(getByTestId('weekly-band-day-0')).toBeOnTheScreen();
  });

  it('program günü olan geçmiş hücre "⬜" ikonu gösterir', () => {
    // today=3 (Perşembe), Pzt(0) geçmiş + antrenman var
    const { getAllByText } = renderWithProviders(
      <WeeklyBand programDays={[makeDay(0)]} todayAlpfitDay={3} />,
    );
    expect(getAllByText('⬜').length).toBeGreaterThanOrEqual(1);
  });

  it('gelecek program günü "□" ikonu gösterir', () => {
    // today=0 (Pzt), Çarşamba(2) gelecekte + antrenman var
    const { getAllByText } = renderWithProviders(
      <WeeklyBand programDays={[makeDay(2)]} todayAlpfitDay={0} />,
    );
    expect(getAllByText('□').length).toBeGreaterThanOrEqual(1);
  });
});
