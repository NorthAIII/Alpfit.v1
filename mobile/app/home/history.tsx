import { formatTrDate } from '@alpfit/shared';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useWorkoutHistory } from '../../src/hooks/useWorkoutHistory';

import type { WorkoutCompletionItem } from '../../src/hooks/useWorkoutHistory';

const TR_WEEKDAY_FMT = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' });

function formatWeekday(isoDate: string): string {
  return TR_WEEKDAY_FMT.format(new Date(isoDate));
}

function HistoryItem({
  item,
  onPress,
}: {
  item: WorkoutCompletionItem;
  onPress: () => void;
}) {
  const dateStr = formatTrDate(new Date(item.scheduledDate));
  const weekday = formatWeekday(item.scheduledDate);

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.programDay.title ?? 'Antrenman'}, ${dateStr}`}
      testID={`history-row-${item.id}`}
    >
      {/* Sol: tarih + gün */}
      <View style={styles.dateBlock}>
        <Text style={styles.dateText}>{dateStr}</Text>
        <Text style={styles.weekdayText}>{weekday}</Text>
      </View>

      {/* Orta: antrenman adı */}
      <Text style={styles.titleText} numberOfLines={1}>
        {item.programDay.title ?? 'Antrenman'}
      </Text>

      {/* Sağ: durum ikonu */}
      <Text style={styles.statusIcon} testID={`status-icon-${item.id}`}>
        {item.isLate ? '⏰' : '✓'}
      </Text>
    </Pressable>
  );
}

function ListFooter({ isFetchingNextPage }: { isFetchingNextPage: boolean }) {
  if (!isFetchingNextPage) return null;
  return (
    <ActivityIndicator
      color="#3B82F6"
      style={styles.footerLoader}
      testID="history-fetch-next-indicator"
    />
  );
}

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useWorkoutHistory();

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <View style={styles.center} testID="history-loading">
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center} testID="history-error">
        <Text style={styles.errorText}>Geçmiş yüklenemedi. İnternetini kontrol et.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => void refetch()}
          accessibilityRole="button"
          accessibilityLabel="Yenile"
          testID="history-retry-button"
        >
          <Text style={styles.retryLabel}>Yenile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Geçmiş</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryItem
            item={item}
            onPress={() =>
              router.push(
                `/workout-history/${item.programDayId}?programId=${item.programDay.programId}&completedAt=${item.completedAt}&isLate=${String(item.isLate)}&title=${encodeURIComponent(item.programDay.title ?? 'Antrenman')}`,
              )
            }
          />
        )}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyBlock} testID="history-empty">
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Henüz tamamlanmış antrenmanın yok.</Text>
            <Text style={styles.emptySubtitle}>
              İlk antrenmanını yapınca burada görünür.
            </Text>
          </View>
        }
        ListFooterComponent={<ListFooter isFetchingNextPage={isFetchingNextPage} />}
        testID="history-list"
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },

  // Liste
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  emptyContainer: {
    flexGrow: 1,
  },

  // Satır
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151922',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  dateBlock: {
    width: 110,
    gap: 2,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  weekdayText: {
    color: '#9AA3B2',
    fontSize: 12,
  },
  titleText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },

  // Boş durum
  emptyBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9AA3B2',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Yükleniyor / Hata
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

  // Footer loader
  footerLoader: {
    paddingVertical: 16,
  },
});
