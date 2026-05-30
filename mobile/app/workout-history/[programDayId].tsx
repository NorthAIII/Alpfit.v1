import { formatTrDate } from '@alpfit/shared';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchProgramById } from '../../src/api/programs';

import type { Program } from '../../src/api/programs';

type WorkoutExercise = Program['days'][number]['exercises'][number];

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { programDayId, programId, completedAt, isLate, title } = useLocalSearchParams<{
    programDayId: string;
    programId: string;
    completedAt?: string;
    isLate?: string;
    title?: string;
  }>();

  const {
    data: program,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => fetchProgramById(programId!),
    enabled: Boolean(programId),
    staleTime: 5 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  const day = program?.days.find((d) => d.id === programDayId) ?? null;
  const exercises: WorkoutExercise[] = day
    ? [...day.exercises].sort((a, b) => a.position - b.position)
    : [];

  const dateLabel = completedAt ? formatTrDate(new Date(completedAt)) : '';
  const titleLabel = title ? decodeURIComponent(title) : 'Antrenman';
  const isLateFlag = isLate === 'true';

  // ── Yükleniyor ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center} testID="detail-loading">
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  // ── Hata / bulunamadı ────────────────────────────────────────────────────────
  if (isError || !program) {
    return (
      <View style={styles.center} testID="detail-error">
        <Text style={styles.errorText}>Antrenman detayı yüklenemedi.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          testID="detail-back-button"
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
          testID="detail-back"
        >
          <Text style={styles.backLabel}>← Geri</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle} numberOfLines={1} testID="detail-title">
            {titleLabel} — {dateLabel}
          </Text>
          <View
            style={[styles.badge, isLateFlag ? styles.badgeLate : styles.badgeDone]}
            testID="detail-badge"
          >
            <Text style={styles.badgeText}>{isLateFlag ? 'Geç Tamamlandı' : 'Tamamlandı'}</Text>
          </View>
        </View>
      </View>

      {/* Egzersiz listesi — salt okunur */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        testID="detail-exercise-list"
      >
        {exercises.map((ex) => (
          <View key={ex.id} style={styles.exerciseRow} testID={`detail-ex-${ex.id}`}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
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
          </View>
        ))}

        {exercises.length === 0 && day ? (
          <Text style={styles.noExercises} testID="detail-no-exercises">
            Bu günde egzersiz bulunamadı.
          </Text>
        ) : null}
      </ScrollView>
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
    gap: 10,
  },
  backLabel: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  headerRow: {
    gap: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeDone: {
    backgroundColor: '#166534',
  },
  badgeLate: {
    backgroundColor: '#78350F',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Egzersiz listesi
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 10,
  },
  exerciseRow: {
    backgroundColor: '#151922',
    borderRadius: 12,
    padding: 14,
  },
  exerciseInfo: {
    gap: 3,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
  noExercises: {
    color: '#9AA3B2',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },

  // Loading/Error
  center: {
    flex: 1,
    backgroundColor: '#0F1115',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
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
