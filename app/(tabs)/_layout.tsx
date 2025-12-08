import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Leaf, Map, BookOpen, Brain } from 'lucide-react-native'; // Nature icons
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false, // We will build custom headers later
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopWidth: 0, // No harsh lines
          elevation: 0, // Remove shadow on Android for flat look
          height: 60,
          paddingBottom: 10,
        },
      }}>
      
      {/* Tab 1: Chat (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Leaf size={24} color={Colors.light.icon} />,
        }}
      />

      {/* Tab 2: Quests */}
      <Tabs.Screen
        name="quests" 
        options={{
          title: 'Quests',
          tabBarIcon: ({ color }) => <Map size={24} color={Colors.light.icon} />,
        }}
      />

      {/* Tab 3: Programs */}
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={Colors.light.icon} />,
        }}
      />

      {/* Tab 4: Memory */}
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Memory',
          tabBarIcon: ({ color }) => <Brain size={24} color={Colors.light.icon} />,
        }}
      />
    </Tabs>
  );
}
