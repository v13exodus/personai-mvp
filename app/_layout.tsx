    // app/(tabs)/_layout.tsx
    import { Tabs } from 'expo-router';
    import React from 'react';
    // Removed Platform import as it's not currently used
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
              borderTopWidth: 0,
              elevation: 0,
              height: 60,
              paddingBottom: 10,
            },
            // The tabs themselves must declare their `name` property which matches the filename
            // inside the (tabs) folder.
          }}>

          {/* Tab 1: Memory (Corresponds to app/(tabs)/memory.tsx) */}
          <Tabs.Screen
            name="memory"
            options={{
              title: 'Memory',
              tabBarIcon: ({ color }) => <Brain size={24} color={Colors.light.icon} />,
            }}
          />

          {/* Tab 2: Programs (Corresponds to app/(tabs)/programs.tsx) */}
          <Tabs.Screen
            name="programs"
            options={{
              title: 'Programs',
              tabBarIcon: ({ color }) => <BookOpen size={24} color={Colors.light.icon} />,
            }}
          />

          {/* Tab 3: Quests (Corresponds to app/(tabs)/quests.tsx) */}
          <Tabs.Screen
            name="quests"
            options={{
              title: 'Quests',
              tabBarIcon: ({ color }) => <Map size={24} color={Colors.light.icon} />,
            }}
          />

          {/* Tab 4: Chat (Corresponds to app/(tabs)/chat.tsx) */}
          <Tabs.Screen
            name="chat"
            options={{
              title: 'Chat',
              tabBarIcon: ({ color }) => <Leaf size={24} color={Colors.light.icon} />,
            }}
          />
        </Tabs>
      );
    }
    