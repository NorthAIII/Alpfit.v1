import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Alpfit',
  slug: config.slug ?? 'alpfit-mobile',
  extra: {
    ...config.extra,
    apiBaseUrl: process.env['EXPO_PUBLIC_API_BASE_URL'] ?? null,
    sentryDsn: process.env['EXPO_PUBLIC_SENTRY_DSN'] ?? null,
  },
});
