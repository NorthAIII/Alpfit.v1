// ExerciseDayCard bileşen testi.
// Alert.alert mock'lanır — jest ortamında native dialog çalışmaz.

import { Alert } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import { ExerciseDayCard } from './ExerciseDayCard';

import type { ProgramDayExercise } from './ExerciseDayCard';

const EXERCISE: ProgramDayExercise = {
  exerciseId: 'ex-1',
  name: 'Bench Press',
  muscleGroup: 'Göğüs',
  sets: 3,
  reps: '10',
};

function renderCard(
  overrides?: Partial<ProgramDayExercise>,
  props?: {
    isFirst?: boolean;
    isLast?: boolean;
    onMoveUp?: jest.Mock;
    onMoveDown?: jest.Mock;
    onDelete?: jest.Mock;
    onChange?: jest.Mock;
  },
) {
  const onMoveUp = props?.onMoveUp ?? jest.fn();
  const onMoveDown = props?.onMoveDown ?? jest.fn();
  const onDelete = props?.onDelete ?? jest.fn();
  const onChange = props?.onChange ?? jest.fn();

  const result = renderWithProviders(
    <ExerciseDayCard
      exercise={{ ...EXERCISE, ...overrides }}
      isFirst={props?.isFirst ?? false}
      isLast={props?.isLast ?? false}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
      onChange={onChange}
    />,
  );

  return { ...result, onMoveUp, onMoveDown, onDelete, onChange };
}

describe('ExerciseDayCard', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('egzersiz adı ve kas grubu render edilir', () => {
    const { getByText } = renderCard();
    expect(getByText('Bench Press')).toBeOnTheScreen();
    expect(getByText('Göğüs')).toBeOnTheScreen();
  });

  it('set ve reps değerleri inputlarda görünür', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('sets-input').props['value']).toBe('3');
    expect(getByTestId('reps-input').props['value']).toBe('10');
  });

  it('kas grubu null ise gösterilmez', () => {
    const { queryByText } = renderCard({ muscleGroup: null });
    expect(queryByText('Göğüs')).toBeNull();
  });

  it('↑ butonu isFirst=true iken disabled (accessibilityState)', () => {
    const { getByTestId } = renderCard({}, { isFirst: true, isLast: false });
    expect(getByTestId('move-up-button').props['accessibilityState']).toEqual({ disabled: true });
  });

  it('↓ butonu isLast=true iken disabled (accessibilityState)', () => {
    const { getByTestId } = renderCard({}, { isFirst: false, isLast: true });
    expect(getByTestId('move-down-button').props['accessibilityState']).toEqual({ disabled: true });
  });

  it('↑ butonu ortadaki elemanda enabled (accessibilityState)', () => {
    const { getByTestId } = renderCard({}, { isFirst: false, isLast: false });
    expect(getByTestId('move-up-button').props['accessibilityState']).toEqual({ disabled: false });
  });

  it('↓ butonu ortadaki elemanda enabled (accessibilityState)', () => {
    const { getByTestId } = renderCard({}, { isFirst: false, isLast: false });
    expect(getByTestId('move-down-button').props['accessibilityState']).toEqual({ disabled: false });
  });

  it('↑ butonuna basılınca onMoveUp çağrılır', () => {
    const onMoveUp = jest.fn();
    const { getByTestId } = renderCard({}, { isFirst: false, onMoveUp });
    fireEvent.press(getByTestId('move-up-button'));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
  });

  it('↓ butonuna basılınca onMoveDown çağrılır', () => {
    const onMoveDown = jest.fn();
    const { getByTestId } = renderCard({}, { isLast: false, onMoveDown });
    fireEvent.press(getByTestId('move-down-button'));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('sil butonuna basılınca Alert.alert çağrılır', () => {
    const { getByTestId } = renderCard();
    fireEvent.press(getByTestId('delete-button'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Egzersizi kaldır',
      'Bu egzersizi kaldır?',
      expect.any(Array),
    );
  });

  it('Alert onay → onDelete çağrılır', () => {
    const onDelete = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const kaldirBtn = buttons?.find((b) => b.text === 'Kaldır');
      kaldirBtn?.onPress?.();
    });
    const { getByTestId } = renderCard({}, { onDelete });
    fireEvent.press(getByTestId('delete-button'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('"Detay ekle" başlangıçta görünür (restSeconds/notes yoksa)', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('show-details-button')).toBeOnTheScreen();
  });

  it('"Detay ekle" basılınca dinlenme/not alanları açılır', () => {
    const { getByTestId, queryByTestId } = renderCard();
    expect(queryByTestId('details-block')).toBeNull();
    fireEvent.press(getByTestId('show-details-button'));
    expect(getByTestId('details-block')).toBeOnTheScreen();
  });

  it('restSeconds varsa detaylar başlangıçta açık', () => {
    const { queryByTestId } = renderCard({ restSeconds: 60 });
    expect(queryByTestId('details-block')).toBeOnTheScreen();
    expect(queryByTestId('show-details-button')).toBeNull();
  });
});
