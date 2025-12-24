import React, { useEffect, useState } from 'react';
import { Button, View, Text, ActivityIndicator, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

// 🔑 Global, one-time session flag
// Used by BiometricGate to skip lock immediately after OAuth
(globalThis as any).oauthSessionEstablished = false;

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Check for an existing session on app load
  const checkSessionAndRedirect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('Session found immediately.');
      (globalThis as any).oauthSessionEstablished = true;

      // Delay navigation to ensure router is mounted
      requestAnimationFrame(() => {
        router.replace('/(tabs)/home');
      });

      return true;
    }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      const hasSession = await checkSessionAndRedirect();
      if (hasSession) return;

      // Web-only: show spinner while Supabase finalizes OAuth
      if (Platform.OS === 'web') {
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('Web: Token detected. Finalizing session...');
          setLoading(true);
        }
      }
    };

    init();

    // Listen for Supabase auth events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AUTH EVENT:', event);

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          (globalThis as any).oauthSessionEstablished = true;

          requestAnimationFrame(() => {
            router.replace('/(tabs)/home');
          });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
  setLoading(true);
  try {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return;
    }

    // 1. Generate the redirect URI (will be exp://... in Expo Go)
    const redirectTo = AuthSession.makeRedirectUri({
      path: 'auth-callback',
    });

    // 2. Get the OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Required for manual WebBrowser handling
      },
    });

    if (error) throw error;

    // 3. Open the browser and capture the result
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // 4. Parse tokens from the # fragment
        const fragment = result.url.split('#')[1];
        if (fragment) {
          const params = new URLSearchParams(fragment);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
          }
        }
      }
    }
  } catch (err) {
    console.error('Auth error:', err);
  } finally {
    setLoading(false);
  }
};

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3E9D7',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          color: '#123122',
        }}
      >
        Sign In
      </Text>

      {loading ? (
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1B4D1B" />
          <Text style={{ marginTop: 10, color: '#666' }}>
            Verifying Identity...
          </Text>
        </View>
      ) : (
        <Button
          title="Sign in with Google"
          onPress={signInWithGoogle}
          color="#1B4D1B"
        />
      )}
    </View>
  );
}
