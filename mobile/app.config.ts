import type { ConfigContext, ExpoConfig } from 'expo/config';

// Deep link domain'leri (TASK-1.25). Gerçek staging `alpfit-staging.kiwiailab.com`
// (bunker-nginx + backend `.well-known/` servis ediyor); `alpfit.app` prod
// placeholder (Yakın 5'te domain alınınca aktif). iOS associatedDomains +
// Android intentFilters bu listeden türetilir — yeni domain eklemek tek satır.
const DEEP_LINK_DOMAINS = ['alpfit-staging.kiwiailab.com', 'alpfit.app'] as const;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Alpfit',
  slug: config.slug ?? 'alpfit-mobile',
  // Sentry RN Expo plugin: build-time source map upload (Yakın 5'te EAS Build
  // pipeline ile aktive). Şu fazda plugin kayıtlı ama auth token olmadan no-op
  // — runtime/dev'de side-effect yok.
  // expo-secure-store (TASK-1.33): refresh token'ı iOS Keychain / Android
  // Keystore'da şifreli saklar. Plugin yalnızca biometric (Face/Touch ID) için
  // usage description ekler; v1'de biometric KAPALI (requireAuthentication:false)
  // ama önerilen kurulum olarak plugin kayıtlı tutulur.
  plugins: [...(config.plugins ?? []), '@sentry/react-native/expo', 'expo-secure-store'],
  // iOS Universal Link — apple-app-site-association domain'leri (applinks:).
  // `...config.ios` ile app.json'daki bundleIdentifier/supportsTablet korunur.
  ios: {
    ...config.ios,
    associatedDomains: DEEP_LINK_DOMAINS.map((domain) => `applinks:${domain}`),
  },
  // Android App Link — autoVerify intent filter (host başına /davet/* yakalar).
  // `...config.android` ile app.json'daki package korunur.
  android: {
    ...config.android,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: DEEP_LINK_DOMAINS.map((host) => ({
          scheme: 'https',
          host,
          pathPrefix: '/davet',
        })),
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  extra: {
    ...config.extra,
    apiBaseUrl: process.env['EXPO_PUBLIC_API_BASE_URL'] ?? null,
    sentryDsn: process.env['EXPO_PUBLIC_SENTRY_DSN'] ?? null,
    // Dev OTP lookup (TASK-1.29) — dev/staging "Dev OTP getir" butonu + internal
    // endpoint token'ı. Production'da false/null; UI gizli, endpoint 404.
    devOtpLookup: process.env['EXPO_PUBLIC_DEV_OTP_LOOKUP'] === 'true',
    adminInternalToken: process.env['EXPO_PUBLIC_DEV_OTP_TOKEN'] ?? null,
  },
});
