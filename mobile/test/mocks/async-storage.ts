// @react-native-async-storage/async-storage test mock'u (TASK-2.14).
// Native AsyncStorage modülü Jest (node) ortamında yok; bellek-içi Map ile
// API yüzeyini taklit eder. jest.config moduleNameMapper bu dosyayı
// `@react-native-async-storage/async-storage` yerine bağlar;
// test/setup.ts her testten sonra `__resetAsyncStorage()` ile sıfırlar.

const store = new Map<string, string>();

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> =>
    store.has(key) ? (store.get(key) as string) : null,

  setItem: async (key: string, value: string): Promise<void> => {
    store.set(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    store.delete(key);
  },

  getAllKeys: async (): Promise<string[]> => Array.from(store.keys()),

  clear: async (): Promise<void> => {
    store.clear();
  },
};

/** Testler arası izolasyon için bellek-içi store'u temizler (setup afterEach). */
export function __resetAsyncStorage(): void {
  store.clear();
}

export default AsyncStorage;
