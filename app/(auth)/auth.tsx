import React, { useEffect } from 'react';
import { Button, View, Text, ActivityIndicator, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // 1. WEB: Use direct redirect (Fixes the Popup/COOP error)
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // Redirects to http://localhost:8081/ which is handled by app/index.tsx
            redirectTo: window.location.origin, 
            skipBrowserRedirect: false, 
          },
        });
        if (error) throw error;
        return; // The page will reload/redirect, so we stop here
      }

      // 2. MOBILE: Use AuthSession (Popup)
      const redirectUrl = makeRedirectUri({ path: '/auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoading(true);
        
        // Check profile (using maybeSingle to prevent 406 errors)
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
        setLoading(false);
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E9D7' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#123122' }}>Sign In</Text>
      {loading ? <ActivityIndicator size="large" color="#1B4D1B" /> : 
        <Button title="Sign in with Google" onPress={signInWithGoogle} color="#1B4D1B" />
      }
    </View>
  );
}