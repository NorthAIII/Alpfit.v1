import { formatTrDate } from '@alpfit/shared';
import { StyleSheet, Text, View } from 'react-native';

export default function LandingScreen() {
  const today = formatTrDate(new Date());
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Merhaba Alpfit</Text>
      <Text style={styles.subtitle}>{today} · Rol seçimi TASK-1.26&apos;da gelecek.</Text>
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
