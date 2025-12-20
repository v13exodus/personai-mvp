import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BiometricGate from '../../components/BiometricGate'; 

export default function TabLayout() {
  return (
    <BiometricGate>
      <Tabs screenOptions={{ tabBarActiveTintColor: '#1B4D1B' }}>
        
        {/* Home Tab */}
        <Tabs.Screen
          name="home" 
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
            headerShown: false, 
          }}
        />

        {/* Chat Tab */}
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
          }}
        />

        {/* FIX: name="actions" (matches actions.tsx) */}
        <Tabs.Screen
          name="actions"
          options={{
            title: 'Actions',
            tabBarIcon: ({ color }) => <Ionicons name="flash" size={24} color={color} />,
          }}
        />

        {/* FIX: name="missions" (matches missions.tsx) */}
        <Tabs.Screen
          name="missions"
          options={{
            title: 'Missions',
            tabBarIcon: ({ color }) => <Ionicons name="flag" size={24} color={color} />,
          }}
        />

      </Tabs>
    </BiometricGate>
  );
}