import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

// GLOBAL FLAG
export const lockState = {
  justLoggedIn: false
};

export default function BiometricGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false); // Start locked by default to be safe
  const appState = useRef(AppState.currentState);

  const authenticate = async () => {
    // Web Browser Check: Often fails hardware check, so we allow manual unlock or bypass
    if (Platform.OS === 'web') {
      console.log('Web environment detected. Use button to unlock.');
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setIsUnlocked(true); // No security available, so open.
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your Dashboard',
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      setIsUnlocked(true);
    }
  };

  useEffect(() => {
    // 1. CHECK BYPASS FLAG
    if (lockState.justLoggedIn) {
      console.log("BiometricGate: Bypass active (Instant)");
      setIsUnlocked(true); // FORCE UNLOCK
      lockState.justLoggedIn = false; // Reset flag
    } else {
      // 2. OTHERWISE AUTHENTICATE
      authenticate();
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && (nextAppState === 'background' || nextAppState === 'inactive')) {
        setIsUnlocked(false);
      }
      if (appState.current.match(/background|inactive/) && nextAppState === 'active') {
        authenticate();
      }
      appState.current = nextAppState;
    });

    return () => { subscription.remove(); };
  }, []);

  if (!isUnlocked) {
    return (
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={64} color="#333" />
        <Text style={styles.lockText}>Protected</Text>
        
        <TouchableOpacity style={styles.button} onPress={authenticate}>
          <Text style={styles.buttonText}>Tap to Unlock</Text>
        </TouchableOpacity>

        {/* DEV BUTTON FOR WEB TESTING */}
        {Platform.OS === 'web' && (
           <TouchableOpacity style={[styles.button, { marginTop: 10, backgroundColor: '#666' }]} onPress={() => setIsUnlocked(true)}>
             <Text style={styles.buttonText}>Web Dev Unlock</Text>
           </TouchableOpacity>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  lockText: { fontSize: 20, fontWeight: 'bold', marginVertical: 20, color: '#333' },
  button: { backgroundColor: '#1B4D1B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});