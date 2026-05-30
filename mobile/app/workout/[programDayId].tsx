import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { VideoModal } from '../../src/components/VideoModal';
import { useMyActiveProgram } from '../../src/hooks/useMemberHome';

import type { Program } from '../../src/api/programs';

type WorkoutExercise = Program['days'][number]['exercises'][number];

export default function WorkoutScreen() {
  const router = useRouter();
  const { programDayId } = useLocalSearchParams<{
    programDayId: string;
    scheduledDate?: string; // TASK-2.12'de tamamlama sinyalinde kullanılır
    isLate?: string; // TASK-2.12'de geç tamamlama bayrağı
  }>();

  const { data: program, isLoading, isError, refetch } = useMyActiveProgram();

  // Tik state: ProgramDayExercise id'si (aynı egzersiz iki kez eklenebilir — PDE id benzersiz)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const day = program?.days.find((d) => d.id === programDayId) ?? null;
  const exercises: WorkoutExercise[] = day
    ? [...day.exercises].sort((a, b) => a.position - b.position)
    : [];

  const allChecked = exercises.length > 0 && checkedIds.size === exercises.length;

  function toggleExercise(pdeId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pdeId)) {
        next.delete(pdeId);
      } else {
        next.add(pdeId);
      }
      return next;
    });
  }

  function handleVideoPress(videoUrl: string) {
    setActiveVideoUrl(videoUrl);
    setShowVideoModal(true);
  }

  function handleFinishWorkout() {
    // TASK-2.12'de POST /workout-completions bağlanacak
    console.log('workout done');
    Alert.alert('Harika iş!');
  }

  // ── Yükleniyor ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center} testID="workout-loading">
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  // ── Hata durumu ──────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.center} testID="workout-error">
        <Text style={styles.errorText}>Programını yükleyemedik. İnternetini kontrol et.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => void refetch()}
          accessibilityRole="button"
          accessibilityLabel="Yenile"
          testID="workout-retry-button"
        >
          <Text style={styles.retryLabel}>Yenile</Text>
        </Pressable>
      </View>
    );
  }

  // ── Gün bulunamadı ────────────────────────────────────────────────────────────
  if (!day) {
    return (
      <View style={styles.center} testID="workout-not-found">
        <Text style={styles.errorText}>Antrenman bulunamadı.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          testID="workout-back-button"
        >
          <Text style={styles.retryLabel}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          testID="workout-back"
        >
          <Text style={styles.backLabel}>← Geri</Text>
        </Pressable>
        <Text style={styles.workoutTitle} numberOfLines={1} testID="workout-title">
          {day.title ?? 'Antrenman'}
        </Text>
      </View>

      {/* Egzersiz listesi */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        testID="exercise-list"
      >
        {exercises.map((ex) => {
          const isChecked = checkedIds.has(ex.id);
          const hasVideo = Boolean(ex.exercise.videoUrl);
          return (
            <View
              key={ex.id}
              style={[styles.exerciseRow, isChecked && styles.exerciseRowChecked]}
              testID={`exercise-row-${ex.id}`}
            >
              {/* Sol: tik kutusu */}
              <Pressable
                style={[styles.checkbox, isChecked && styles.checkboxChecked]}
                onPress={() => toggleExercise(ex.id)}
                accessibilityRole="checkbox"
                accessibilityLabel={`${ex.exercise.name} ${isChecked ? 'işaretli' : 'işaretsiz'}`}
                accessibilityState={{ checked: isChecked }}
                testID={`checkbox-${ex.id}`}
              >
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>

              {/* Orta: bilgi */}
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, isChecked && styles.exerciseNameChecked]}>
                  {ex.exercise.name}
                </Text>
                <Text style={styles.exerciseMeta}>
                  {ex.sets}×{ex.reps}
                  {ex.restSeconds != null ? ` · dinlenme ${ex.restSeconds}sn` : ''}
                </Text>
                {ex.notes ? (
                  <Text style={styles.exerciseNotes} numberOfLines={2}>
                    {ex.notes}
                  </Text>
                ) : null}
              </View>

              {/* Sağ: video butonu */}
              {hasVideo ? (
                <Pressable
                  style={styles.videoButton}
                  onPress={() => handleVideoPress(ex.exercise.videoUrl!)}
                  accessibilityRole="button"
                  accessibilityLabel={`${ex.exercise.name} videosunu izle`}
                  testID={`video-button-${ex.id}`}
                >
                  <Text style={styles.videoIcon}>▶</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Antrenmanı Bitir footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.finishButton, !allChecked && styles.finishButtonDisabled]}
          onPress={allChecked ? handleFinishWorkout : undefined}
          disabled={!allChecked}
          accessibilityRole="button"
          accessibilityLabel={allChecked ? 'Antrenmanı Bitir' : 'Tüm egzersizleri işaretle'}
          accessibilityState={{ disabled: !allChecked }}
          testID="finish-button"
        >
          <Text style={[styles.finishLabel, !allChecked && styles.finishLabelDisabled]}>
            {allChecked ? 'Antrenmanı Bitir 🎉' : 'Tüm egzersizleri işaretle'}
          </Text>
        </Pressable>
      </View>

      {/* Video Modal */}
      {activeVideoUrl ? (
        <VideoModal
          isVisible={showVideoModal}
          videoUrl={activeVideoUrl}
          onClose={() => setShowVideoModal(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 8,
  },
  backLabel: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },

  // Egzersiz listesi
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151922',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  exerciseRowChecked: {
    opacity: 0.7,
  },

  // Tik kutusu
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Egzersiz bilgisi
  exerciseInfo: {
    flex: 1,
    gap: 3,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseNameChecked: {
    color: '#9AA3B2',
  },
  exerciseMeta: {
    color: '#9AA3B2',
    fontSize: 13,
  },
  exerciseNotes: {
    color: '#5A6373',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Video butonu
  videoButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E2A3D',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  videoIcon: {
    color: '#3B82F6',
    fontSize: 14,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  finishButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonDisabled: {
    backgroundColor: '#1A1F2B',
  },
  finishLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  finishLabelDisabled: {
    color: '#5A6373',
  },

  // Loading/Error/NotFound ortak
  center: {
    flex: 1,
    backgroundColor: '#0F1115',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  loadingText: {
    color: '#9AA3B2',
    fontSize: 15,
  },
  errorText: {
    color: '#9AA3B2',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
