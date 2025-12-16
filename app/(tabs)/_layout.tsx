import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      
      {/* Home Tab (Mapped to home.tsx) */}
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

      {/* Action Tab */}
      <Tabs.Screen
        name="action"
        options={{
          title: 'Action',
          tabBarIcon: ({ color }) => <Ionicons name="flash" size={24} color={color} />,
        }}
      />

      {/* Mission Tab */}
      <Tabs.Screen
        name="mission"
        options={{
          title: 'Mission',
          tabBarIcon: ({ color }) => <Ionicons name="flag" size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}