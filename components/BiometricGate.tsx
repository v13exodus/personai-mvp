import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const authenticate = async () => {
    // 🌐 Web: never block
    if (Platform.OS === 'web') {
      setIsUnlocked(true);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    // If biometrics are unavailable, do not block
    if (!hasHardware || !isEnrolled) {
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

  // 🔑 Initial gate decision
  useEffect(() => {
    // If session was just established via OAuth, skip lock once
    if ((globalThis as any).oauthSessionEstablished) {
      setIsUnlocked(true);
      (globalThis as any).oauthSessionEstablished = false;
    } else {
      authenticate();
    }
  }, []);

  // 🔒 Re-lock when app backgrounds, unlock on return
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        // App going to background → lock
        if (
          appState.current === 'active' &&
          nextAppState !== 'active'
        ) {
          setIsUnlocked(false);
        }

        // App returning to foreground → authenticate
        if (
          appState.current !== 'active' &&
          nextAppState === 'active'
        ) {
          authenticate();
        }

        appState.current = nextAppState;
      }
    );

    return () => subscription.remove();
  }, []);

  if (!isUnlocked) {
    return (
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={64} color="#333" />
        <Text style={styles.lockText}>Protected</Text>

        <TouchableOpacity style={styles.button} onPress={authenticate}>
          <Text style={styles.buttonText}>Tap to Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
    backgroundColor: '#1B4D1B',
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
