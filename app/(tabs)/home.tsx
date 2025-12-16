import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import ProfileCard from '@/components/ProfileCard';
import { supabase } from '@/utils/supabase';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // 1. Authenticate on mount (optional) or wait for user tap
  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for devices without biometrics (or Simulator)
        setIsUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock PersonalAI',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setIsUnlocked(true);
      }
    } catch (error) {
      console.log('Auth error:', error);
      // On web/simulator errors, we might want to just unlock for dev convenience
      if (Platform.OS === 'web') setIsUnlocked(true); 
    }
  };

  useEffect(() => {
    // Fetch User Data
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // 2. The "Veil" (Privacy Shield)
  if (!isUnlocked) {
    return (
      <View style={styles.lockContainer}>
        <View style={styles.lockCircle} />
        <Text style={styles.lockTitle}>PersonalAI</Text>
        <Text style={styles.lockSubtitle}>Protected</Text>
        
        <TouchableOpacity style={styles.unlockButton} onPress={authenticate}>
          <Text style={styles.unlockButtonText}>Tap to Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. The Actual Home Content (Your original code)
  return (
    <ScrollView style={styles.container}>
      <ProfileCard userEmail={userEmail} />

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Chat Summary</Text>
        <Text style={styles.summaryContent}>You have 3 unread messages.</Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Actions Summary</Text>
        <Text style={styles.summaryContent}>2 pending actions need your attention.</Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Missions Summary</Text>
        <Text style={styles.summaryContent}>1 active mission in progress.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Lock Screen Styles
  lockContainer: {
    flex: 1,
    backgroundColor: '#F3E9D7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B4D1B',
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#123122',
    marginBottom: 5,
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#6A7D6A',
    marginBottom: 40,
  },
  unlockButton: {
    backgroundColor: '#1B4D1B',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Main Content Styles
  container: {
    flex: 1,
    backgroundColor: '#F8F1E3',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    // Android Shadow
    elevation: 2,
    // Fix for "Text Node" error: ensure no stray spaces here
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#123122',
    marginBottom: 8,
  },
  summaryContent: {
    fontSize: 14,
    color: '#6A7D6A',
  },
});