import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

// Program Builder temel ekranı (TASK-2.07). PT'nin program şablonunu düzenlediği
// ekranın iskeleti: üstte gün sekmeleri, ortada boş gün içeriği, altta kaydet
// placeholder'ı. Tam egzersiz listesi + auto-save TASK-2.08 / TASK-2.09'da bağlanır.
//
// dayOfWeek dönüşümü: JS getDay() → Alpfit (0=Pzt..6=Paz): (jsDay + 6) % 7

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function todayAlpfitDay(): number {
  return (new Date().getDay() + 6) % 7;
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

  const [activeDay, setActiveDay] = useState(todayAlpfitDay);

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
              onPress={() => setActiveDay(index)}
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
      <View style={styles.dayContent} testID="day-content">
        <Text style={styles.emptyDayText}>Bugün egzersiz yok — + ile ekle</Text>
        <Pressable
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Egzersiz ekle"
          testID="add-exercise-fab"
        >
          <Text style={styles.addButtonLabel}>+</Text>
        </Pressable>
      </View>

      {/* Kaydet Placeholder */}
      <Pressable
        style={styles.saveButton}
        accessibilityRole="button"
        accessibilityLabel="Kaydet"
        testID="save-button"
      >
        <Text style={styles.saveLabel}>Kaydet</Text>
      </Pressable>
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
  dayContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyDayText: {
    color: '#9AA3B2',
    fontSize: 15,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonLabel: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
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
