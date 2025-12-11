import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
  MessageSquare, // For Chat
  BookOpen,      // For Quests (BookOpen for 'quests' as per your app.json description)
  Layers,        // For Programs
  Brain,         // For Memory
} from 'lucide-react-native'; // Using lucide-react-native for icons

// Import your Colors constant (we will define this next if you don't have it yet)
import { darkTheme } from '@/constants/Colors'; 
// Note: We'll create the '@/constants/Colors.ts' file in the next step to match your app.json.
// For now, this will use a placeholder or assume a basic darkTheme if you have one.

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We'll handle custom headers per screen if needed
        tabBarActiveTintColor: darkTheme.tabBarActive, // Active tab color from app.json
        tabBarInactiveTintColor: darkTheme.tabBarInactive, // Inactive tab color from app.json
        tabBarStyle: {
          backgroundColor: darkTheme.tabBarBackground, // Tab bar background from app.json
          borderTopWidth: 0, // No border top for a cleaner look
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
          height: Platform.OS === 'ios' ? 90 : 60, // Adjust height for iOS notch
          paddingBottom: Platform.OS === 'ios' ? 25 : 0, // Padding for iOS notch
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Quicksand_600SemiBold', // Will be integrated with expo-font later
        },
      }}
      initialRouteName="index" // Set Chat as the default selected tab as per app.json
    >
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Memory',
          tabBarIcon: ({ color }) => <Brain size={24} color={color} />, // Lucide icon
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ color }) => <Layers size={24} color={color} />, // Lucide icon
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />, // Lucide icon
        }}
      />
      <Tabs.Screen
        name="index" // This corresponds to your ChatScreen (app/(tabs)/index.tsx)
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />, // Lucide icon
          headerShown: false, // Hide header on ChatScreen as it's typically custom or handled internally
        }}
      />
    </Tabs>
  );
}