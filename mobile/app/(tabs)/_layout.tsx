import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

// PT ana sekme iskeleti (TASK-1.31). Şu an tek sekme: "Üyeler". "Profil" sekmesi
// sonraki fazlarda eklenir. Role guard (trainer dışı erişim engeli) + auth-gate'li
// yönlendirme TASK-1.33'te kurulur — bu fazda sekme yapısı + Üyeler ekranı.

export default function TabsLayout() {
  const { t } = useTranslation('members');

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
    </Tabs>
  );
}
