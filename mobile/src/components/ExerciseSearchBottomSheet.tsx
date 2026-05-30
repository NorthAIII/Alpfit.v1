import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAddExercise, useExercises } from '../hooks/useExercises';

import type { Exercise } from '../hooks/useExercises';

const MUSCLE_GROUPS = ['Tümü', 'Göğüs', 'Sırt', 'Omuz', 'Bacak', 'Kol', 'Karın'];

// YouTube veya Vimeo URL formatı
const VIDEO_URL_REGEX = /^https:\/\/(www\.youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/).+/;

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseSearchBottomSheet({ isVisible, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | undefined>(undefined);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState('');
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState('');

  const {
    data: exercises,
    isLoading,
    isError,
    refetch,
  } = useExercises({
    search,
    ...(selectedMuscleGroup !== undefined ? { muscleGroup: selectedMuscleGroup } : {}),
  });

  const addExercise = useAddExercise();

  function handleMuscleGroupSelect(group: string) {
    setSelectedMuscleGroup(group === 'Tümü' ? undefined : group);
  }

  function handleVideoUrlChange(url: string) {
    setCustomVideoUrl(url);
    if (url.length === 0 || VIDEO_URL_REGEX.test(url)) {
      setVideoUrlError('');
    } else {
      setVideoUrlError('Geçersiz video URL');
    }
  }

  async function handleAddCustomExercise() {
    if (!customName.trim()) return;
    if (customVideoUrl && !VIDEO_URL_REGEX.test(customVideoUrl)) return;

    try {
      const trimmedMuscle = customMuscleGroup.trim();
      const trimmedVideo = customVideoUrl.trim();
      const newExercise = await addExercise.mutateAsync({
        name: customName.trim(),
        ...(trimmedMuscle ? { muscleGroup: trimmedMuscle } : {}),
        ...(trimmedVideo ? { videoUrl: trimmedVideo } : {}),
      });
      resetCustomForm();
      onSelect(newExercise);
      onClose();
    } catch {
      // hata inline gösterilir (addExercise.isError)
    }
  }

  function resetCustomForm() {
    setCustomName('');
    setCustomMuscleGroup('');
    setCustomVideoUrl('');
    setVideoUrlError('');
    setShowCustomForm(false);
  }

  function handleClose() {
    setSearch('');
    setSelectedMuscleGroup(undefined);
    resetCustomForm();
    onClose();
  }

  const isAddDisabled = !customName.trim() || (customVideoUrl.length > 0 && !!videoUrlError);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      testID="exercise-bottom-sheet"
    >
      <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Kapat" />

      <View style={styles.sheet}>
        {/* Başlık */}
        <View style={styles.header}>
          <Text style={styles.title}>Egzersiz Seç</Text>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            hitSlop={8}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {!showCustomForm ? (
          <>
            {/* Arama inputu */}
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Egzersiz ara..."
              placeholderTextColor="#9AA3B2"
              accessibilityLabel="Egzersiz ara"
              testID="exercise-search-input"
            />

            {/* Kas grubu filtresi */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsRow}
              contentContainerStyle={styles.chipsContent}
              testID="muscle-group-chips"
            >
              {MUSCLE_GROUPS.map((group) => {
                const isActive =
                  group === 'Tümü'
                    ? selectedMuscleGroup === undefined
                    : selectedMuscleGroup === group;
                return (
                  <TouchableOpacity
                    key={group}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => handleMuscleGroupSelect(group)}
                    accessibilityRole="button"
                    accessibilityLabel={`${group} filtresi`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Liste */}
            {isLoading && (
              <View style={styles.centered} testID="exercises-loading">
                <ActivityIndicator size="large" color="#4F8EF7" />
              </View>
            )}

            {isError && !isLoading && (
              <View style={styles.centered} testID="exercises-error">
                <Text style={styles.errorText}>Yüklenemedi, tekrar dene</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => void refetch()}
                  accessibilityRole="button"
                  accessibilityLabel="Tekrar Dene"
                >
                  <Text style={styles.retryText}>Tekrar Dene</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && !isError && exercises !== undefined && (
              <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                testID="exercises-list"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.exerciseRow}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} seç`}
                  >
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    {item.muscleGroup !== null && (
                      <Text style={styles.muscleGroupText}>{item.muscleGroup}</Text>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.centered} testID="exercises-empty">
                    <Text style={styles.emptyText}>Egzersiz bulunamadı</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => setShowCustomForm(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Kendi egzersizini ekle"
                    >
                      <Text style={styles.retryText}>Kendi egzersizini ekle</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            )}

            {/* Kendi egzersizini ekle CTA (liste dolu olsa da görünür) */}
            {!isLoading && !isError && (exercises === undefined || exercises.length > 0) && (
              <TouchableOpacity
                style={styles.addCustomCta}
                onPress={() => setShowCustomForm(true)}
                accessibilityRole="button"
                accessibilityLabel="Kendi egzersizini ekle"
              >
                <Text style={styles.addCustomCtaText}>+ Kendi egzersizini ekle</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* Custom egzersiz formu */
          <View style={styles.customForm} testID="custom-exercise-form">
            <Text style={styles.customFormTitle}>Yeni Egzersiz</Text>

            <Text style={styles.fieldLabel}>
              Egzersiz adı <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.fieldInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="Egzersiz adını gir"
              placeholderTextColor="#9AA3B2"
              accessibilityLabel="Egzersiz adı"
              testID="custom-name-input"
            />

            <Text style={styles.fieldLabel}>Hedef kas grubu (opsiyonel)</Text>
            <TextInput
              style={styles.fieldInput}
              value={customMuscleGroup}
              onChangeText={setCustomMuscleGroup}
              placeholder="ör. Göğüs"
              placeholderTextColor="#9AA3B2"
              accessibilityLabel="Hedef kas grubu"
              testID="custom-muscle-input"
            />

            <Text style={styles.fieldLabel}>Video URL (opsiyonel)</Text>
            <TextInput
              style={[styles.fieldInput, videoUrlError ? styles.fieldInputError : null]}
              value={customVideoUrl}
              onChangeText={handleVideoUrlChange}
              placeholder="YouTube veya Vimeo linki"
              placeholderTextColor="#9AA3B2"
              autoCapitalize="none"
              keyboardType="url"
              accessibilityLabel="Video URL"
              testID="custom-video-input"
            />
            {videoUrlError !== '' && (
              <Text style={styles.fieldError} testID="video-url-error">
                {videoUrlError}
              </Text>
            )}

            {addExercise.isError && (
              <Text style={styles.fieldError} testID="add-exercise-error">
                Eklenemedi, tekrar dene
              </Text>
            )}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetCustomForm}
                accessibilityRole="button"
                accessibilityLabel="İptal"
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, isAddDisabled && styles.addButtonDisabled]}
                onPress={() => void handleAddCustomExercise()}
                disabled={isAddDisabled}
                accessibilityRole="button"
                accessibilityLabel="Ekle"
                accessibilityState={{ disabled: isAddDisabled }}
                testID="add-exercise-button"
              >
                {addExercise.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Ekle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#1B2230',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3346',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  closeIcon: {
    color: '#9AA3B2',
    fontSize: 18,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#242F42',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A3346',
  },
  chipsRow: {
    marginTop: 12,
    flexGrow: 0,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#242F42',
    borderWidth: 1,
    borderColor: '#2A3346',
  },
  chipActive: {
    backgroundColor: '#4F8EF7',
    borderColor: '#4F8EF7',
  },
  chipText: {
    color: '#9AA3B2',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#E55C5C',
    fontSize: 14,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9AA3B2',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#4F8EF7',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3346',
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  muscleGroupText: {
    color: '#9AA3B2',
    fontSize: 12,
    marginTop: 2,
  },
  addCustomCta: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCustomCtaText: {
    color: '#4F8EF7',
    fontSize: 14,
    fontWeight: '600',
  },
  customForm: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  customFormTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#9AA3B2',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  required: {
    color: '#E55C5C',
  },
  fieldInput: {
    backgroundColor: '#242F42',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A3346',
  },
  fieldInputError: {
    borderColor: '#E55C5C',
  },
  fieldError: {
    color: '#E55C5C',
    fontSize: 12,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3346',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9AA3B2',
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4F8EF7',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
