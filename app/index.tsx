import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('has_accepted_disclaimer')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile?.has_accepted_disclaimer) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/(auth)/disclaimer');
          }
        } catch (e) {
          console.error("Profile check failed", e);
          setLoading(false); 
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1B4D1B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FIXED: Replaced Image with a View to stop the network error */}
      <View style={[styles.logo, { backgroundColor: '#1B4D1B' }]} />
      
      <Text style={styles.title}>Welcome to PersonalAI</Text>
      <Text style={styles.subtitle}>Your minimalist personal companion.</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Get Started" 
          onPress={() => router.push('/(auth)/auth')} 
          color="#1B4D1B"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E9D7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#123122',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#486356',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
});