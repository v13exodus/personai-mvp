import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const appState = useRef(AppState.currentState);

  // 1. Function to trigger the biometric prompt
  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Fallback if no biometrics setup (dev mode or old phone)
      setIsUnlocked(true);
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

  // 2. Initial Lock Check (Runs once on mount)
  useEffect(() => {
    // NOTE: In a real production app, we might check a "justLoggedIn" flag here.
    // For now, we default to triggering the lock to be safe.
    authenticate();
  }, []);

  // 3. App State Listener (Locks when you leave the app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) && 
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // App is going to background -> LOCK IT
        setIsUnlocked(false);
      }

      if (
        appState.current.match(/background|inactive/) && 
        nextAppState === 'active'
      ) {
        // App came back to foreground -> PROMPT UNLOCK
        // We only prompt if it's currently locked
        authenticate();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 4. Render Locked State
  if (!isUnlocked) {
    return (
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={64} color="#333" />
        <Text style={styles.lockText}>Dashboard Locked</Text>
        <TouchableOpacity style={styles.button} onPress={authenticate}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 5. Render Unlocked Content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  lockText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});