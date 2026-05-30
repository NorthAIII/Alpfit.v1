import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

// Ana ekran placeholder'ı (TASK-1.30). Onboarding sonrası (profil oluşturma ya
// da mevcut üye girişi) buraya gelinir. Gerçek içerik sonraki task'larda:
// PT "Üyeler" sekmesi TASK-1.31, üye dashboard sonraki fazlar, auth-gate'li
// yönlendirme + token persist TASK-1.33. Şimdilik "Hoş geldin, [isim]" yeterli.

export default function HomePlaceholderScreen() {
  const { t } = useTranslation('common');
  const params = useLocalSearchParams<{ name?: string }>();
  const name = typeof params.name === 'string' ? params.name : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {t('home.welcome', { name })}
      </Text>
      <Text style={styles.subtitle}>{t('home.placeholder')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 96,
    backgroundColor: '#0F1115',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9AA3B2',
    fontSize: 15,
    lineHeight: 21,
  },
});
