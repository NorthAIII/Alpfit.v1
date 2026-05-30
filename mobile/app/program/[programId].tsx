import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ExerciseDayCard } from '../../src/components/ExerciseDayCard';
import { ExerciseSearchBottomSheet } from '../../src/components/ExerciseSearchBottomSheet';
import { useProgramAutoSave } from '../../src/hooks/useProgramAutoSave';
import { useCopyProgram, usePublishProgram, useTrainerMembers } from '../../src/hooks/useProgram';

import type { ProgramDayExercise } from '../../src/components/ExerciseDayCard';
import type { Exercise } from '../../src/hooks/useExercises';

// Program Builder ekranı — TASK-2.09.
// Auto-save: programDays değiştiğinde 1sn debounce → PATCH /programs/:id.
// Publish: PT explicit "Kaydet ve Yayınla" → POST /programs/:id/publish → üye görür.
// Copy: "Programı Kopyala..." → üye listesi modal → POST /programs/:id/copy.
//
// dayOfWeek dönüşümü: JS getDay() → Alpfit (0=Pzt..6=Paz): (jsDay + 6) % 7

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type ProgramStatus = 'draft' | 'active' | 'archived';

function todayAlpfitDay(): DayOfWeek {
  return ((new Date().getDay() + 6) % 7) as DayOfWeek;
}

function emptyProgramDays(): Record<DayOfWeek, ProgramDayExercise[]> {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
}

function hasAnyExercise(programDays: Record<DayOfWeek, ProgramDayExercise[]>): boolean {
  return Object.values(programDays).some((exercises) => exercises.length > 0);
}

// Auto-save indicator — header'ın altında minimal metin
function SaveIndicator({ saveState }: { saveState: string }) {
  if (saveState === 'idle') return null;
  if (saveState === 'saving') {
    return (
      <Text style={styles.saveIndicatorSaving} testID="save-indicator-saving">
        ⏳ Kaydediliyor...
      </Text>
    );
  }
  if (saveState === 'saved') {
    return (
      <Text style={styles.saveIndicatorSaved} testID="save-indicator-saved">
        ✓ Taslak kaydedildi
      </Text>
    );
  }
  // error
  return (
    <Text style={styles.saveIndicatorError} testID="save-indicator-error">
      ⚠️ Kaydetme hatası
    </Text>
  );
}

export default function ProgramBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    programId: string;
    memberId: string;
    memberFirstName: string;
    memberLastName: string;
    programStatus: string;
  }>();

  const { programId, memberId, memberFirstName, memberLastName } = params;
  const memberName = `${memberFirstName ?? ''} ${memberLastName ?? ''}`.trim();

  const [programStatus, setProgramStatus] = useState<ProgramStatus>(
    (params.programStatus as ProgramStatus | undefined) ?? 'draft',
  );
  const [activeDay, setActiveDay] = useState<DayOfWeek>(todayAlpfitDay);
  const [programDays, setProgramDays] = useState<Record<DayOfWeek, ProgramDayExercise[]>>(
    emptyProgramDays,
  );
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const { saveState, cancelPendingAutoSave } = useProgramAutoSave(programId ?? '', programDays);

  const { data: trainerMembers, isLoading: isMembersLoading } = useTrainerMembers();

  const { mutate: doPublish, isPending: isPublishing } = usePublishProgram({
    programId: programId ?? '',
    memberId: memberId ?? '',
    onSuccess: () => {
      setProgramStatus('active');
      Alert.alert('Kaydedildi', 'Program kaydedildi! Üye görebilir artık.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    },
  });

  const { mutate: doCopy, isPending: isCopying } = useCopyProgram();

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

  function handlePublish() {
    // Debounce timer'ı iptal et (race condition önlemi)
    cancelPendingAutoSave();

    // En az 1 egzersiz zorunlu
    if (!hasAnyExercise(programDays)) {
      Alert.alert('Uyarı', 'En az 1 gün için egzersiz ekle.');
      return;
    }

    doPublish();
  }

  function handleCopySelect(targetMemberId: string, targetMemberName: string) {
    setShowCopyModal(false);
    doCopy(
      { programId: programId ?? '', targetMemberId },
      {
        onSuccess: () => {
          Alert.alert('Kopyalandı', `${targetMemberName}'a taslak oluşturuldu.`);
        },
        onError: () => {
          Alert.alert('Hata', 'Kopyalama başarısız, tekrar dene.');
        },
      },
    );
  }

  // Publish butonu disable koşulları
  const isPublishDisabled = saveState === 'saving' || isPublishing;
  const publishLabel = programStatus === 'draft' ? 'Kaydet ve Yayınla' : 'Güncelle';
  const statusLabel = programStatus === 'draft' ? 'Taslak' : 'Aktif';

  // Kopyalama modalında kendi üyesini filtrele (aynı üyeye kopyalama anlamsız)
  const copyableMembers = (trainerMembers ?? []).filter((m) => m.id !== memberId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            testID="builder-back-button"
          >
            <Text style={styles.backLabel}>← Geri</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowCopyModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Programı kopyala"
            testID="copy-cta-button"
          >
            <Text style={styles.copyLabel}>Kopyala...</Text>
          </Pressable>
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Program Düzenle — {memberName}
        </Text>

        <View style={styles.headerMeta}>
          <View style={styles.badge} testID="status-badge">
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
          <SaveIndicator saveState={saveState} />
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

      {/* Publish Butonu */}
      <Pressable
        style={[styles.saveButton, isPublishDisabled && styles.saveButtonDisabled]}
        onPress={handlePublish}
        disabled={isPublishDisabled}
        accessibilityRole="button"
        accessibilityLabel={publishLabel}
        testID="publish-button"
      >
        <Text style={styles.saveLabel}>{isPublishing ? 'Kaydediliyor...' : publishLabel}</Text>
      </Pressable>

      {/* Egzersiz seç bottom sheet */}
      <ExerciseSearchBottomSheet
        isVisible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        onSelect={handleAddExercise}
      />

      {/* Kopyalama Modal */}
      <Modal
        visible={showCopyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCopyModal(false)}
        testID="copy-modal"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hangi üyeye kopyalansın?</Text>
              <Pressable
                onPress={() => setShowCopyModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                testID="copy-modal-close"
              >
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            {isMembersLoading ? (
              <Text style={styles.modalEmptyText} testID="copy-modal-loading">
                Yükleniyor...
              </Text>
            ) : copyableMembers.length === 0 ? (
              <Text style={styles.modalEmptyText} testID="copy-modal-empty">
                Başka üye yok.
              </Text>
            ) : (
              <FlatList
                data={copyableMembers}
                keyExtractor={(m) => m.id}
                renderItem={({ item }) => {
                  const fullName = `${item.firstName} ${item.lastName}`;
                  return (
                    <Pressable
                      style={styles.memberRow}
                      onPress={() => handleCopySelect(item.id, fullName)}
                      disabled={isCopying}
                      accessibilityRole="button"
                      accessibilityLabel={`${fullName} üyesine kopyala`}
                      testID={`copy-member-${item.id}`}
                    >
                      <Text style={styles.memberName}>{fullName}</Text>
                    </Pressable>
                  );
                }}
                testID="copy-member-list"
              />
            )}
          </View>
        </View>
      </Modal>
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backLabel: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  copyLabel: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#1E2A3D',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#9AA3B2',
    fontSize: 12,
    fontWeight: '600',
  },
  saveIndicatorSaving: {
    color: '#9AA3B2',
    fontSize: 12,
  },
  saveIndicatorSaved: {
    color: '#22C55E',
    fontSize: 12,
  },
  saveIndicatorError: {
    color: '#EF4444',
    fontSize: 12,
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Copy Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#151922',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3346',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    color: '#9AA3B2',
    fontSize: 18,
  },
  modalEmptyText: {
    color: '#9AA3B2',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  memberRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A3D',
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
