import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. WEB SPECIFIC: Manual Hash Handling
      if (Platform.OS === 'web' && window.location.hash?.includes('access_token')) {
        try {
          const params = new URLSearchParams(window.location.hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) {
              (globalThis as any).oauthSessionEstablished = true;
              return; 
            }
          }
        } catch (e) {
          console.error('Manual hash parsing failed:', e);
        }
      }

      // 2. Standard Session Check (Mobile & Web Cold Start)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session found (Cold Start). Redirecting...');
        // If we have a session, assume we don't need to lock immediately on cold start
        (globalThis as any).oauthSessionEstablished = true;
        router.replace('/(tabs)/home');
      } else {
        if (mounted && !window.location.hash?.includes('access_token')) {
          setChecking(false);
        }
      }
    };

    init();

    // 3. Listener handles the result
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        console.log(`Auth Event: ${event}. Redirecting...`);
        (globalThis as any).oauthSessionEstablished = true;
        router.replace('/(tabs)/home');
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGetStarted = () => {
    router.push('/(auth)/auth');
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1B4D1B" />
        <Text style={{marginTop: 10, color: '#1B4D1B'}}>Verifying Identity...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.circle} />
      <Text style={styles.title}>Welcome to PersonalAI</Text>
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3E9D7', alignItems: 'center', justifyContent: 'center' },
  circle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1B4D1B', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#123122', marginBottom: 20 },
  button: { backgroundColor: '#1B4D1B', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});