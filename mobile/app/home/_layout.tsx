import { Tabs } from 'expo-router';
import { Text } from 'react-native';

// Üye alt navigasyonu (TASK-2.13). Sekmeler: "Ana Sayfa" (index) + "Geçmiş" (history).
// Trainer alt navigasyonu (tabs)/_layout.tsx'te ayrı yönetilir.

function HomeIcon({ focused }: { focused: boolean }) {
  return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>🏠</Text>;
}

function HistoryIcon({ focused }: { focused: boolean }) {
  return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>🕐</Text>;
}

export default function MemberHomeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#5A6373',
        tabBarStyle: { backgroundColor: '#151922', borderTopColor: '#2A2F3A' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ focused }) => <HistoryIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}
