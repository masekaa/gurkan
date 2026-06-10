import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { profile, loading } = useAuth();
  if (!loading && !profile) return <Redirect href="/(auth)/login" />;

  const role = profile?.role;
  const isBusiness = role === 'business';
  const isAdmin = role === 'admin';
  const isUser = !isBusiness && !isAdmin;
  // Hidden tabs use `href: null` so the screen stays routable but the button
  // is removed for the irrelevant role.
  const hide = { href: null } as const;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          shadowColor: '#1B1B22',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      {/* Customer tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keşfet',
          ...(isUser ? {} : hide),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Randevular',
          ...(isUser ? {} : hide),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="loyalty"
        options={{
          title: 'Sadakat',
          ...(isUser ? {} : hide),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Business tabs */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Randevular',
          ...(isBusiness ? {} : hide),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Panel',
          ...(isBusiness ? {} : hide),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'İşletmem',
          ...(isBusiness ? {} : hide),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Admin */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Yönetim',
          ...(isAdmin ? {} : hide),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Shared */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
