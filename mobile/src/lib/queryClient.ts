import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 7 * 24 * 60 * 60 * 1000, // 7 gün — offline hafızada haftalık program cache'de kalır
      staleTime: 5 * 60 * 1000, // 5 dk — arka planda refetch eşiği
      retry: 2, // offline'da 3. retry'da sessizce fail eder
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'alpfit-cache-v1',
});

if (__DEV__) {
  console.log('QueryClient ready');
}
