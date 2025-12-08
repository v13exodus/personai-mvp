// app/index.tsx - This file manages the initial Auth/Disclaimer flow with Supabase
import React, { useEffect, useState } from 'react';
import { SplashScreen, Redirect } from 'expo-router';
import supabase from '../supabaseConfig'; // <--- CORRECT PATH (one level up)
import { Session } from '@supabase/supabase-js'; // Import Session type
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors'; // Make sure Colors are accessible

export default function AuthFlowGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean | null>(null);

  useEffect(() => {
    console.log("AuthFlowGate useEffect: Starting authentication check with Supabase.");

    // Listen for auth state changes from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log("onAuthStateChange callback fired. event:", _event, "session:", currentSession ? currentSession.user?.id : "null");
      setSession(currentSession);

      if (currentSession) {
        const currentUserId = currentSession.user.id;

        // Use upsert to either create the profile if it doesn't exist, or update if it does.
        // We'll set hasAcceptedDisclaimer to false by default, to be updated by the disclaimer screen.
        console.log(`Upserting user profile for: ${currentUserId}`);
        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('user_profiles')
          .upsert(
            { id: currentUserId, hasAcceptedDisclaimer: false, created_at: new Date().toISOString() },
            { onConflict: 'id', ignoreDuplicates: false }
          )
          .select('hasAcceptedDisclaimer')
          .single();

        if (upsertError) {
          console.error("Error upserting user profile in Supabase:", upsertError.message);
          setHasAcceptedDisclaimer(false);
        } else if (upsertedProfile) {
          setHasAcceptedDisclaimer(upsertedProfile.hasAcceptedDisclaimer);
          console.log(`User profile upserted. Disclaimer status: ${upsertedProfile.hasAcceptedDisclaimer}`);
        } else {
          console.warn("Upserted profile data not returned. Assuming disclaimer false.");
          setHasAcceptedDisclaimer(false);
        }
      } else {
        console.log("No Supabase session found. User is logged out.");
        setHasAcceptedDisclaimer(false);
      }
      setIsLoadingAuth(false);
      SplashScreen.hideAsync();
      console.log("onAuthStateChange: setIsLoadingAuth(false) and SplashScreen.hideAsync() called.");
    });

    // Cleanup listener
    return () => {
      console.log("AuthFlowGate useEffect: Cleaning up auth state listener.");
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Run once on mount

  console.log(`AuthFlowGate render [Initial Check]: isLoadingAuth=${isLoadingAuth}, hasAcceptedDisclaimer=${hasAcceptedDisclaimer}, session=${session ? session.user?.id : "null"}`);

  // Show Loading UI while we're still determining auth/disclaimer status
  if (isLoadingAuth || hasAcceptedDisclaimer === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading PersonAI...</Text>
      </View>
    );
  }

  // If we're done loading AND user is NOT logged in OR disclaimer is NOT accepted
  if (!session || !hasAcceptedDisclaimer) {
    console.log("AuthFlowGate render [Redirect Logic]: Condition met for /disclaimer. Redirecting.");
    return <Redirect href="/disclaimer" />;
  }

  // If we reach here, it means: user is authenticated AND disclaimer is accepted.
  console.log("AuthFlowGate render [Redirect Logic]: Condition met for /(tabs). Redirecting.");
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
});
