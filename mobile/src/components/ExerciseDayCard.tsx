import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export interface ProgramDayExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  sets: number;
  reps: string; // "8" veya "8-12"
  restSeconds?: number;
  notes?: string;
}

interface Props {
  exercise: ProgramDayExercise;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onChange: (updates: Partial<ProgramDayExercise>) => void;
}

export function ExerciseDayCard({
  exercise,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onChange,
}: Props) {
  const [showDetails, setShowDetails] = useState(
    exercise.restSeconds !== undefined || exercise.notes !== undefined,
  );

  function handleDelete() {
    Alert.alert('Egzersizi kaldır', 'Bu egzersizi kaldır?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Kaldır', style: 'destructive', onPress: onDelete },
    ]);
  }

  function handleSetsChange(v: string) {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) onChange({ sets: n });
  }

  function handleRestChange(v: string) {
    if (v === '') return; // alan boş bırakıldığında state değişmez
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 0) onChange({ restSeconds: n });
  }

  return (
    <View style={styles.card} testID="exercise-day-card">
      {/* Başlık satırı: egzersiz adı + kas grubu + sil */}
      <View style={styles.headerRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.muscleGroup !== null && exercise.muscleGroup !== undefined && (
            <Text style={styles.muscleGroup}>{exercise.muscleGroup}</Text>
          )}
        </View>
        <Pressable
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Egzersizi sil"
          hitSlop={8}
          testID="delete-button"
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </Pressable>
      </View>

      {/* Set / Reps giriş alanları + ↑↓ sıralama butonları */}
      <View style={styles.controlsRow}>
        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Set</Text>
            <TextInput
              style={styles.input}
              value={String(exercise.sets)}
              onChangeText={handleSetsChange}
              keyboardType="number-pad"
              accessibilityLabel="Set sayısı"
              testID="sets-input"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tekrar</Text>
            <TextInput
              style={styles.input}
              value={exercise.reps}
              onChangeText={(v) => onChange({ reps: v })}
              keyboardType="default"
              accessibilityLabel="Tekrar sayısı"
              testID="reps-input"
            />
          </View>
        </View>

        <View style={styles.orderButtons}>
          <Pressable
            onPress={onMoveUp}
            disabled={isFirst}
            accessibilityRole="button"
            accessibilityLabel="Yukarı taşı"
            accessibilityState={{ disabled: isFirst }}
            style={[styles.orderBtn, isFirst && styles.orderBtnDisabled]}
            testID="move-up-button"
          >
            <Text style={[styles.orderBtnText, isFirst && styles.orderBtnTextDisabled]}>↑</Text>
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={isLast}
            accessibilityRole="button"
            accessibilityLabel="Aşağı taşı"
            accessibilityState={{ disabled: isLast }}
            style={[styles.orderBtn, isLast && styles.orderBtnDisabled]}
            testID="move-down-button"
          >
            <Text style={[styles.orderBtnText, isLast && styles.orderBtnTextDisabled]}>↓</Text>
          </Pressable>
        </View>
      </View>

      {/* Opsiyonel detaylar: başlangıçta gizli, "Detay ekle" ile açılır */}
      {!showDetails && (
        <Pressable
          onPress={() => setShowDetails(true)}
          accessibilityRole="button"
          accessibilityLabel="Detay ekle"
          testID="show-details-button"
        >
          <Text style={styles.detailToggle}>+ Detay ekle</Text>
        </Pressable>
      )}

      {showDetails && (
        <View style={styles.detailsBlock} testID="details-block">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dinlenme (sn)</Text>
            <TextInput
              style={styles.input}
              value={exercise.restSeconds !== undefined ? String(exercise.restSeconds) : ''}
              onChangeText={handleRestChange}
              keyboardType="number-pad"
              placeholder="ör. 60"
              placeholderTextColor="#9AA3B2"
              accessibilityLabel="Dinlenme süresi"
              testID="rest-input"
            />
          </View>
          <View style={styles.notesGroup}>
            <Text style={styles.inputLabel}>Not</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={exercise.notes ?? ''}
              onChangeText={(v) => onChange({ notes: v })}
              placeholder="ör. yavaş ekzantrik"
              placeholderTextColor="#9AA3B2"
              accessibilityLabel="Not"
              testID="notes-input"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151922',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  muscleGroup: {
    color: '#9AA3B2',
    fontSize: 12,
  },
  deleteIcon: {
    fontSize: 18,
    color: '#9AA3B2',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#9AA3B2',
    fontSize: 11,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0F1115',
    borderWidth: 1,
    borderColor: '#2A3346',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 14,
    width: 70,
    textAlign: 'center',
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  orderBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#1E2A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnDisabled: {
    opacity: 0.3,
  },
  orderBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  orderBtnTextDisabled: {
    color: '#9AA3B2',
  },
  detailToggle: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '500',
  },
  detailsBlock: {
    gap: 8,
  },
  notesGroup: {
    gap: 4,
  },
  notesInput: {
    width: '100%',
    textAlign: 'left',
  },
});
