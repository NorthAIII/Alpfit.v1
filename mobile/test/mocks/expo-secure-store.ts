// expo-secure-store test mock'u (TASK-1.33). Gerçek Keychain/Keystore native
// modülü Jest (node) ortamında yok; bellek-içi Map ile API yüzeyini taklit eder.
// jest.config moduleNameMapper bu dosyayı `expo-secure-store` yerine bağlar;
// test/setup.ts her testten sonra `__resetSecureStore()` ile sıfırlar.

const store = new Map<string, string>();

export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}

export async function getItemAsync(key: string): Promise<string | null> {
  return store.has(key) ? (store.get(key) as string) : null;
}

export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}

/** Testler arası izolasyon için bellek-içi store'u temizler (setup afterEach). */
export function __resetSecureStore(): void {
  store.clear();
}
