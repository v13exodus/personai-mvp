import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { lockState } from '../components/BiometricGate';
import supabase from '../supabaseConfig';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. WEB SPECIFIC: Manual Hash Handling
      // Sometimes Supabase auto-detect fails on redirects; we do it manually here.
      if (Platform.OS === 'web' && window.location.hash?.includes('access_token')) {
        console.log('Web: Hash detected. Manually parsing tokens...');
        try {
          // Remove the '#' and parse
          const params = new URLSearchParams(window.location.hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) {
              console.log('Manual session set successful.');
              lockState.justLoggedIn = true;
              // The listener below will catch the SIGNED_IN event next
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
        if (lockState.justLoggedIn) lockState.isLocked = false;
        router.replace('/(tabs)/home');
      } else {
        // Only stop checking if we didn't just manually set the session
        if (mounted && !window.location.hash?.includes('access_token')) {
          setChecking(false);
        }
      }
    };

    init();

    // 3. Listener handles the result
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth Event: ${event}`);
      
      if (session) {
        console.log('Session confirmed. Redirecting...');
        lockState.justLoggedIn = true;
        lockState.isLocked = false;
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