// Component testi — useExercises + useAddExercise hook'ları mock'lanır.
// Sebep: react-native-renderer@19.2.3 / react@19.2.6 minor versiyon farkı,
// TanStack Query observer aktifken fireEvent.changeText tetiklendiğinde
// componentDidUpdate versiyonlarını karşılaştırıp hata fırlatır.
// Hook'ları mock'layarak TanStack Query'yi devre dışı bırakıyoruz.

import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import { ExerciseSearchBottomSheet } from './ExerciseSearchBottomSheet';

import type { Exercise } from '../hooks/useExercises';

jest.mock('../hooks/useExercises', () => ({
  useExercises: jest.fn(),
  useAddExercise: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const hooks = jest.mocked(require('../hooks/useExercises'));

const EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Bench Press', muscleGroup: 'Göğüs', videoUrl: null, isCustom: false },
  { id: 'e2', name: 'Squat', muscleGroup: 'Bacak', videoUrl: null, isCustom: false },
];

const defaultUseExercises = {
  data: EXERCISES,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

const defaultUseAddExercise = {
  mutateAsync: jest.fn(),
  isPending: false,
  isError: false,
};

function renderSheet(props?: Partial<Parameters<typeof ExerciseSearchBottomSheet>[0]>) {
  const onClose = jest.fn();
  const onSelect = jest.fn();
  const result = renderWithProviders(
    <ExerciseSearchBottomSheet isVisible={true} onClose={onClose} onSelect={onSelect} {...props} />,
  );
  return { ...result, onClose, onSelect };
}

describe('ExerciseSearchBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hooks.useExercises.mockReturnValue(defaultUseExercises);
    hooks.useAddExercise.mockReturnValue(defaultUseAddExercise);
  });

  it('açılınca egzersiz listesi render edilir (loading → list)', () => {
    hooks.useExercises.mockReturnValue({ ...defaultUseExercises, isLoading: false });
    const { getByText, queryByTestId } = renderSheet();

    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Squat')).toBeTruthy();
    expect(queryByTestId('exercises-loading')).toBeNull();
  });

  it('isLoading=true iken skeleton/spinner gösterilir', () => {
    hooks.useExercises.mockReturnValue({
      ...defaultUseExercises,
      data: undefined,
      isLoading: true,
    });
    const { getByTestId } = renderSheet();

    expect(getByTestId('exercises-loading')).toBeTruthy();
  });

  it('egzersiz satırına tıklanınca onSelect doğru egzersizle çağrılır', () => {
    const { getByLabelText, onSelect, onClose } = renderSheet();

    fireEvent.press(getByLabelText('Bench Press seç'));

    expect(onSelect).toHaveBeenCalledWith(EXERCISES[0]!);
    expect(onClose).toHaveBeenCalled();
  });

  it('search input değişince useExercises search parametresi güncellenir', () => {
    const { getByTestId } = renderSheet();

    fireEvent.changeText(getByTestId('exercise-search-input'), 'bench');

    // useExercises en son search=bench ile çağrılmış olmalı
    // (Hook mock'landığından debounce bypass edilir — debounce hook testinde ayrıca test edilir)
    expect(hooks.useExercises).toHaveBeenCalledWith(expect.objectContaining({ search: 'bench' }));
  });

  it('kas grubu chip seçilince useExercises muscleGroup ile çağrılır', () => {
    const { getByLabelText } = renderSheet();

    fireEvent.press(getByLabelText('Göğüs filtresi'));

    expect(hooks.useExercises).toHaveBeenCalledWith(
      expect.objectContaining({ muscleGroup: 'Göğüs' }),
    );
  });

  it('API hata verirse "Yüklenemedi, tekrar dene" gösterilir', () => {
    hooks.useExercises.mockReturnValue({
      ...defaultUseExercises,
      data: undefined,
      isLoading: false,
      isError: true,
    });
    const { getByTestId } = renderSheet();

    expect(getByTestId('exercises-error')).toBeTruthy();
  });

  it('custom egzersiz formu: ad boşken Ekle butonu disabled', () => {
    hooks.useExercises.mockReturnValue({ ...defaultUseExercises, data: [] });
    const { getByLabelText, getByTestId } = renderSheet();

    fireEvent.press(getByLabelText('Kendi egzersizini ekle'));

    const addButton = getByTestId('add-exercise-button');
    expect(addButton).toBeDisabled();
  });

  it('custom egzersiz eklendi → mutateAsync çağrılır ve onSelect yeni egzersizle döner', async () => {
    const newExercise: Exercise = {
      id: 'e99',
      name: 'Arnold Press',
      muscleGroup: 'Omuz',
      videoUrl: null,
      isCustom: true,
    };
    const mutateAsync = jest.fn().mockResolvedValue(newExercise);
    hooks.useAddExercise.mockReturnValue({ ...defaultUseAddExercise, mutateAsync });
    hooks.useExercises.mockReturnValue({ ...defaultUseExercises, data: [] });

    const { getByLabelText, getByTestId, onSelect } = renderSheet();

    fireEvent.press(getByLabelText('Kendi egzersizini ekle'));
    fireEvent.changeText(getByTestId('custom-name-input'), 'Arnold Press');
    fireEvent.press(getByTestId('add-exercise-button'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Arnold Press' }));
    });

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(newExercise));
  });

  it('geçersiz video URL girilirse hata mesajı gösterilir ve Ekle disabled kalır', () => {
    hooks.useExercises.mockReturnValue({ ...defaultUseExercises, data: [] });
    const { getByLabelText, getByTestId, queryByTestId } = renderSheet();

    fireEvent.press(getByLabelText('Kendi egzersizini ekle'));
    fireEvent.changeText(getByTestId('custom-name-input'), 'Test Egzersiz');
    fireEvent.changeText(getByTestId('custom-video-input'), 'https://invalid-url.com/video');

    expect(getByTestId('video-url-error')).toBeTruthy();
    expect(getByTestId('add-exercise-button')).toBeDisabled();

    // Geçerli URL girince hata kalkar
    fireEvent.changeText(getByTestId('custom-video-input'), 'https://www.youtube.com/watch?v=abc');
    expect(queryByTestId('video-url-error')).toBeNull();
    expect(getByTestId('add-exercise-button')).not.toBeDisabled();
  });

  it('isVisible=false iken modal görünmez', () => {
    const { queryByTestId } = renderWithProviders(
      <ExerciseSearchBottomSheet isVisible={false} onClose={jest.fn()} onSelect={jest.fn()} />,
    );
    expect(queryByTestId('exercises-loading')).toBeNull();
    expect(queryByTestId('exercises-list')).toBeNull();
  });
});
