import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { usePushToken } from '../../src/hooks/usePushToken';

// PT ana sekme iskeleti (TASK-1.31, TASK-1.33).
// TASK-3.11: usePushToken burada çağrılır — PT her app açtığında token yenilenir. Sekmeler: "Üyeler" + "Ayarlar".
// Role guard (trainer dışı erişim engeli) sonraki fazlarda; bu fazda auto-login
// (TASK-1.33) trainer'ı bu gruba, member'ı /home'a yönlendirir.

export default function TabsLayout() {
  usePushToken();
  const { t } = useTranslation('members');
  const { t: tSettings } = useTranslation('settings');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#5A6373',
        tabBarStyle: { backgroundColor: '#151922', borderTopColor: '#2A2F3A' },
      }}
    >
      <Tabs.Screen name="members" options={{ title: t('tab.members') }} />
      <Tabs.Screen name="settings" options={{ title: tSettings('title') }} />
    </Tabs>
  );
}
