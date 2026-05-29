import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Alpfit',
  slug: config.slug ?? 'alpfit-mobile',
  // Sentry RN Expo plugin: build-time source map upload (Yakın 5'te EAS Build
  // pipeline ile aktive). Şu fazda plugin kayıtlı ama auth token olmadan no-op
  // — runtime/dev'de side-effect yok.
  plugins: [...(config.plugins ?? []), '@sentry/react-native/expo'],
  extra: {
    ...config.extra,
    apiBaseUrl: process.env['EXPO_PUBLIC_API_BASE_URL'] ?? null,
    sentryDsn: process.env['EXPO_PUBLIC_SENTRY_DSN'] ?? null,
  },
});
