import React, { useEffect, useState } from 'react';
import { Button, View, Text, ActivityIndicator, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import supabase from '../../supabaseConfig';
import { useRouter } from 'expo-router';
import { lockState } from '../../components/BiometricGate';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const checkSessionAndRedirect = async () => {
    // 1. Check if we already have a session (Aggressive Check)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('Session found immediately. Redirecting...');
      lockState.justLoggedIn = true;
      router.replace('/(tabs)/home');
      return true;
    }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      // A. Check for existing session first
      const hasSession = await checkSessionAndRedirect();
      if (hasSession) return;

      // B. Web Specific: If hash exists, show spinner while we wait for Supabase
      if (Platform.OS === 'web') {
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('Web: Token detected. Finalizing session...');
          setLoading(true);
        }
      }
    };
    init();

    // C. Listen for new events (Backup)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AUTH EVENT:', event);
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          lockState.justLoggedIn = true;
          console.log('Login event received. Redirecting...');
          router.replace('/(tabs)/home');
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

      const redirectTo = AuthSession.makeRedirectUri({ useProxy: true });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const fragment = result.url.split('#')[1];
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E9D7' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#123122' }}>Sign In</Text>
      
      {loading ? (
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1B4D1B" />
          <Text style={{ marginTop: 10, color: '#666' }}>Verifying Identity...</Text>
        </View>
      ) : (
        <Button title="Sign in with Google" onPress={signInWithGoogle} color="#1B4D1B" />
      )}
    </View>
  );
}