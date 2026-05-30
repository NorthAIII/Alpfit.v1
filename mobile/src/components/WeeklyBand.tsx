import { StyleSheet, Text, View } from 'react-native';

import type { Program } from '../hooks/useMemberHome';

// TR gün harfleri, Alpfit dayOfWeek sırasıyla (0=Pzt … 6=Paz)
const TR_DAY_LETTERS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'] as const;

interface WeeklyBandProps {
  programDays: Program['days'];
  todayAlpfitDay: number;
  // TASK-2.12'de useWorkoutHistory ile doldurulacak — şimdilik placeholder
  workoutCompletions?: unknown[];
}

function getDayStatus(
  day: number,
  todayAlpfitDay: number,
  hasWorkout: boolean,
): { icon: string; isToday: boolean } {
  if (day === todayAlpfitDay) return { icon: '▶', isToday: true };
  if (day < todayAlpfitDay) {
    return { icon: hasWorkout ? '⬜' : '-', isToday: false };
  }
  return { icon: hasWorkout ? '□' : '-', isToday: false };
}

export function WeeklyBand({ programDays, todayAlpfitDay }: WeeklyBandProps) {
  const workoutDays = new Set(programDays.map((d) => d.dayOfWeek));

  return (
    <View style={styles.container} testID="weekly-band">
      {TR_DAY_LETTERS.map((letter, i) => {
        const { icon, isToday } = getDayStatus(i, todayAlpfitDay, workoutDays.has(i));
        return (
          <View
            key={i}
            style={[styles.cell, isToday && styles.todayCell]}
            testID={`weekly-band-day-${i}`}
          >
            <Text style={[styles.dayLetter, isToday && styles.todayLetter]}>{letter}</Text>
            <Text style={[styles.statusIcon, isToday && styles.todayIcon]}>{icon}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  cell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
  },
  todayCell: {
    backgroundColor: '#1E2A3D',
  },
  dayLetter: {
    color: '#9AA3B2',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  todayLetter: {
    color: '#3B82F6',
  },
  statusIcon: {
    color: '#5A6373',
    fontSize: 14,
  },
  todayIcon: {
    color: '#3B82F6',
  },
});
