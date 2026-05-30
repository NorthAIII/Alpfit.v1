import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseDayCard } from '../../src/components/ExerciseDayCard';
import { ExerciseSearchBottomSheet } from '../../src/components/ExerciseSearchBottomSheet';

import type { ProgramDayExercise } from '../../src/components/ExerciseDayCard';
import type { Exercise } from '../../src/hooks/useExercises';

// Program Builder ekranı — TASK-2.08.
// PT seçili günün egzersiz listesini düzenler: ekle / sil / ↑↓ sırala / set-reps-not düzenle.
// Tüm değişiklikler local state'te — backend senkronu TASK-2.09'da (auto-save + publish).
//
// dayOfWeek dönüşümü: JS getDay() → Alpfit (0=Pzt..6=Paz): (jsDay + 6) % 7

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function todayAlpfitDay(): DayOfWeek {
  return ((new Date().getDay() + 6) % 7) as DayOfWeek;
}

function emptyProgramDays(): Record<DayOfWeek, ProgramDayExercise[]> {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
}

export default function ProgramBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    programId: string;
    memberId: string;
    memberFirstName: string;
    memberLastName: string;
  }>();

  const { memberFirstName, memberLastName } = params;
  const memberName = `${memberFirstName ?? ''} ${memberLastName ?? ''}`.trim();

  const [activeDay, setActiveDay] = useState<DayOfWeek>(todayAlpfitDay);
  const [programDays, setProgramDays] = useState<Record<DayOfWeek, ProgramDayExercise[]>>(
    emptyProgramDays,
  );
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const exercises = programDays[activeDay];

  function handleAddExercise(exercise: Exercise) {
    const newExercise: ProgramDayExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: 3,
      reps: '10',
    };
    setProgramDays((prev) => ({
      ...prev,
      [activeDay]: [...prev[activeDay], newExercise],
    }));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setProgramDays((prev) => {
      const list = [...prev[activeDay]];
      [list[index - 1], list[index]] = [list[index]!, list[index - 1]!];
      return { ...prev, [activeDay]: list };
    });
  }

  function handleMoveDown(index: number) {
    setProgramDays((prev) => {
      const list = [...prev[activeDay]];
      if (index === list.length - 1) return prev;
      [list[index], list[index + 1]] = [list[index + 1]!, list[index]!];
      return { ...prev, [activeDay]: list };
    });
  }

  function handleDelete(index: number) {
    setProgramDays((prev) => {
      const list = [...prev[activeDay]];
      list.splice(index, 1);
      return { ...prev, [activeDay]: list };
    });
  }

  function handleChange(index: number, updates: Partial<ProgramDayExercise>) {
    setProgramDays((prev) => {
      const list = [...prev[activeDay]];
      list[index] = { ...list[index]!, ...updates };
      return { ...prev, [activeDay]: list };
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          style={styles.backButton}
          testID="builder-back-button"
        >
          <Text style={styles.backLabel}>← Geri</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Program Düzenle — {memberName}
        </Text>
        <View style={styles.badge} testID="status-badge">
          <Text style={styles.badgeText}>Taslak</Text>
        </View>
      </View>

      {/* Gün Sekmeleri */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={DAYS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.daysContainer}
        renderItem={({ item, index }) => {
          const isActive = index === activeDay;
          return (
            <Pressable
              onPress={() => setActiveDay(index as DayOfWeek)}
              style={[styles.dayTab, isActive ? styles.dayTabActive : null]}
              accessibilityRole="tab"
              accessibilityLabel={`${item} sekmesi`}
              accessibilityState={{ selected: isActive }}
              testID={`day-tab-${index}`}
            >
              <Text style={[styles.dayLabel, isActive ? styles.dayLabelActive : null]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
        testID="day-tabs"
      />

      {/* Gün İçerik Alanı */}
      {exercises.length === 0 ? (
        <View style={styles.emptyState} testID="empty-day-state">
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyText}>Bu gün için egzersiz eklenmedi</Text>
          <Pressable
            style={styles.emptyAddButton}
            onPress={() => setShowBottomSheet(true)}
            accessibilityRole="button"
            accessibilityLabel="Egzersiz ekle"
            testID="empty-add-button"
          >
            <Text style={styles.emptyAddLabel}>+ Egzersiz Ekle</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.exerciseList}
          contentContainerStyle={styles.exerciseListContent}
          testID="exercise-list"
        >
          {exercises.map((exercise, index) => (
            <ExerciseDayCard
              key={`${exercise.exerciseId}-${index}`}
              exercise={exercise}
              isFirst={index === 0}
              isLast={index === exercises.length - 1}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onDelete={() => handleDelete(index)}
              onChange={(updates) => handleChange(index, updates)}
            />
          ))}
          <Pressable
            style={styles.addExerciseRow}
            onPress={() => setShowBottomSheet(true)}
            accessibilityRole="button"
            accessibilityLabel="Egzersiz ekle"
            testID="add-exercise-fab"
          >
            <Text style={styles.addExerciseLabel}>+ Egzersiz Ekle</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Kaydet Placeholder — TASK-2.09'da auto-save + publish bağlanır */}
      <Pressable
        style={styles.saveButton}
        accessibilityRole="button"
        accessibilityLabel="Kaydet"
        testID="save-button"
      >
        <Text style={styles.saveLabel}>Kaydet</Text>
      </Pressable>

      {/* Egzersiz seç bottom sheet */}
      <ExerciseSearchBottomSheet
        isVisible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        onSelect={handleAddExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 4,
  },
  backButton: {
    marginBottom: 8,
  },
  backLabel: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E2A3D',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  badgeText: {
    color: '#9AA3B2',
    fontSize: 12,
    fontWeight: '600',
  },
  daysContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#151922',
  },
  dayTabActive: {
    backgroundColor: '#3B82F6',
  },
  dayLabel: {
    color: '#9AA3B2',
    fontSize: 14,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: '#9AA3B2',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyAddButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  emptyAddLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  addExerciseRow: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3346',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addExerciseLabel: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
