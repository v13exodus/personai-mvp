// app/auth-callback.tsx
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // This page is just a bridge. 
    // Supabase's onAuthStateChange listener in your other files 
    // will detect the session and redirect the user.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)/home');
      }
    };
    checkSession();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E9D7' }}>
      <ActivityIndicator size="large" color="#1B4D1B" />
    </View>
  );
}