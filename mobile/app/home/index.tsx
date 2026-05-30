import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WeeklyBand } from '../../src/components/WeeklyBand';
import { getTodayWorkout, todayAlpfitDay, useMyActiveProgram } from '../../src/hooks/useMemberHome';

export default function MemberHomeScreen() {
  const router = useRouter();
  const { data: program, isLoading, isError, refetch } = useMyActiveProgram();

  const today = todayAlpfitDay();
  const todayWorkout = program ? getTodayWorkout(program, today) : null;

  // ── Yükleniyor ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* TASK-M3: streak alanı buraya gelecek */}
        <View style={styles.skeletonCard} testID="loading-skeleton" />
        <ActivityIndicator
          color="#3B82F6"
          style={styles.loader}
          testID="home-loading-indicator"
        />
      </View>
    );
  }

  // ── Hata durumu ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.container}>
        {/* TASK-M3: streak alanı buraya gelecek */}
        <View style={styles.errorCard} testID="error-card">
          <Text style={styles.errorText}>Programını yükleyemedik. İnternetini kontrol et.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void refetch()}
            accessibilityRole="button"
            accessibilityLabel="Yenile"
            testID="retry-button"
          >
            <Text style={styles.retryLabel}>Yenile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Program yok: bekleme durumu ───────────────────────────────────────────
  if (!program) {
    return (
      <View style={styles.container}>
        {/* TASK-M3: streak alanı buraya gelecek */}
        <View style={styles.waitingCard} testID="waiting-card">
          <Text style={styles.waitingEmoji}>🏋️</Text>
          <Text style={styles.waitingText}>
            Antrenörün senin için programını hazırlıyor. Hazır olduğunda buradan görebileceksin.
          </Text>
        </View>
      </View>
    );
  }

  // ── Program var ───────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      {/* TASK-M3: streak alanı buraya gelecek */}

      {/* Banner stack — TASK-2.14'te bağlanacak */}
      <View />

      {/* BUGÜN kartı */}
      {todayWorkout ? (
        <View style={styles.todayCard} testID="today-workout-card">
          <Text style={styles.todayLabel}>Bugün</Text>
          <Text style={styles.todayTitle}>{todayWorkout.title ?? 'Antrenman'}</Text>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push(`/workout/${todayWorkout.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Antrenmana git"
            testID="go-to-workout-button"
          >
            <Text style={styles.ctaLabel}>Antrenmana git →</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.restCard} testID="rest-day-card">
          <Text style={styles.restEmoji}>🌿</Text>
          <Text style={styles.restTitle}>Bugün dinlenme günün</Text>
          <Text style={styles.restSub}>Yarın da antrenman gününü bekliyor olabilirsin.</Text>
        </View>
      )}

      {/* Haftalık band */}
      <WeeklyBand programDays={program.days} todayAlpfitDay={today} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    paddingHorizontal: 20,
    paddingTop: 72,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 32,
    gap: 16,
  },

  // Yükleniyor
  skeletonCard: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#1A1F2B',
    marginBottom: 12,
  },
  loader: {
    marginTop: 8,
  },

  // Hata
  errorCard: {
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
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

  // Bekleme
  waitingCard: {
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  waitingEmoji: {
    fontSize: 40,
  },
  waitingText: {
    color: '#9AA3B2',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // BUGÜN kartı — antrenman var
  todayCard: {
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  todayLabel: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  todayTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // BUGÜN kartı — dinlenme günü
  restCard: {
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  restEmoji: {
    fontSize: 36,
  },
  restTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  restSub: {
    color: '#9AA3B2',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
