import { formatTrDate } from '@alpfit/shared';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export default function LandingScreen() {
  const { t } = useTranslation('common');
  const today = formatTrDate(new Date());
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('landing.greeting')}</Text>
      <Text style={styles.subtitle}>{t('landing.todayPrefix', { date: today })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0F1115',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtitle: {
    color: '#9AA3B2',
    fontSize: 14,
    textAlign: 'center',
  },
});
