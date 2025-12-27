import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, PrimaryBlue, Gray100, White } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colors = Colors['light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PrimaryBlue,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: White,
          borderTopColor: Gray100,
          borderTopWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'Vị trí',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: 'Thanh toán',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide this tab
        }}
      />
    </Tabs>
  );
}
