// app/welcome.tsx - The new dynamic Welcome Screen
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, SplashScreen } from 'expo-router';
import { Colors } from '@/constants/Colors'; // Your custom colors
import supabase from '../supabaseConfig';

// --- IMPROVEMENT: Externalize app description/vision/disclaimer text ---
const APP_CONTENT = {
  firstTime: {
    title: "Welcome to PersonAI: Your Mirror-Mentor for Identity Transformation",
    vision: "PersonAI is a calm, grounding, and emotionally safe space designed to help you find clarity, uncover underlying causes, and guide you towards actionable transformation. Our warm intelligence reflects your thoughts, helps you build self-awareness, and supports you on your journey.",
    keyFunction: "Simply converse, reflect, and discover personalized Quests and Programs tailored to your growth.",
    privacyStatement: "Your conversations are always private and secure. We are not therapists or medical professionals; PersonAI is for self-reflection and personal growth, not professional advice.",
    buttonText: "I Understand and Agree & Begin My Journey",
  },
  returning: {
    buttonText: "Continue Your Journey",
  }
};

export default function WelcomeScreen() {
  const router = useRouter();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);
  const [userLogline, setUserLogline] = useState<string | null>(null);
  const [lastQuestOrProgram, setLastQuestOrProgram] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial data fetching
  const [isProcessing, setIsProcessing] = useState(false); // For button click processing

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("WelcomeScreen useEffect: Fetching user data.");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.warn("WelcomeScreen: No active Supabase session. Assuming first-time user.");
        setIsFirstTimeUser(true); // Treat as first-time if no session
        setIsLoading(false);
        SplashScreen.hideAsync(); // Ensure splash is hidden
        return;
      }

      const currentUserId = session.user.id;
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('hasAcceptedDisclaimer, logline, last_quest_title, current_program_title')
        .eq('id', currentUserId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("WelcomeScreen: Error fetching user profile from Supabase:", profileError.message);
        setIsFirstTimeUser(true); // Fallback to first-time on error
      } else if (userProfile) {
        const acceptedDisclaimer = userProfile.hasAcceptedDisclaimer;
        setIsFirstTimeUser(!acceptedDisclaimer); // If not accepted, it's first time.

        if (acceptedDisclaimer) { // For returning users who accepted disclaimer
          setUserLogline(userProfile.logline);
          if (userProfile.last_quest_title) {
            setLastQuestOrProgram(`your quest to "${userProfile.last_quest_title}"`);
          } else if (userProfile.current_program_title) {
            setLastQuestOrProgram(`your journey to "${userProfile.current_program_title}"`);
          }
        }
      } else {
        console.warn("WelcomeScreen: User profile not found, treating as first-time user.");
        setIsFirstTimeUser(true);
      }
      setIsLoading(false);
      SplashScreen.hideAsync(); // Hide splash after initial data fetch
    };

    fetchUserData();
  }, []);


  const handleBegin = async () => {
    if (isProcessing) {
      console.log("WelcomeScreen: Button already processing, returning.");
      return;
    }
    setIsProcessing(true);
    console.log("WelcomeScreen: 'Begin' button clicked. isFirstTimeUser:", isFirstTimeUser);

    try {
      if (isFirstTimeUser) {
        console.log("WelcomeScreen: Attempting anonymous sign-in for first-time user.");
        const { data, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
        if (!data.user) throw new Error("Anonymous sign-in did not return a user.");

        const user = data.user;
        console.log("WelcomeScreen: Authenticated User ID (Supabase):", user.id);

        console.log("WelcomeScreen: Updating user profile to set hasAcceptedDisclaimer: true.");
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ hasAcceptedDisclaimer: true })
          .eq('id', user.id);
        if (updateError) throw updateError;
        console.log(`WelcomeScreen: Disclaimer accepted and recorded for user ${user.id}.`);

      } else {
        console.log("WelcomeScreen: Returning user, proceeding to chat.");
      }

      console.log("WelcomeScreen: Navigating to /(tabs).");
      router.replace('/(tabs)');

    } catch (error: any) {
      Alert.alert("Error", error.message);
      console.error("WelcomeScreen: Error during process:", error);
    } finally {
      setIsProcessing(false);
      console.log("WelcomeScreen: Finished processing 'Begin' button click.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.brandPrimaryGreen} /> {/* Corrected: Using brandPrimaryGreen */}
        <Text style={styles.loadingText}>Preparing your PersonAI space...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.backgroundPaper }]}> {/* Corrected: Using backgroundPaper */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isFirstTimeUser ? (
          // --- First-Time User Content (Description + Disclaimer) ---
          <>
            <Text style={[styles.title, { color: Colors.light.textPrimary }]}> {/* Corrected: Using textPrimary */}
              {APP_CONTENT.firstTime.title}
            </Text>
            <Text style={[styles.bodyText, { color: Colors.light.textSecondary }]}> {/* Corrected: Using textSecondary */}
              {APP_CONTENT.firstTime.vision}
            </Text>
            <Text style={[styles.bodyText, { color: Colors.light.textSecondary, marginTop: 15 }]}> {/* Corrected: Using textSecondary */}
              {APP_CONTENT.firstTime.keyFunction}
            </Text>
            <View style={styles.disclaimerBox}>
              <Text style={[styles.disclaimerText, { color: Colors.light.textSecondary }]}> {/* Corrected: Using textSecondary */}
                {APP_CONTENT.firstTime.privacyStatement}
              </Text>
            </View>
          </>
        ) : (
          // --- Returning User Content (Personalized Welcome) ---
          <>
            <Text style={[styles.title, { color: Colors.light.textPrimary }]}> {/* Corrected: Using textPrimary */}
              Welcome back.
            </Text>
            {userLogline && (
              <Text style={[styles.bodyText, { color: Colors.light.textSecondary, marginTop: 10 }]}> {/* Corrected: Using textSecondary */}
                It sounds like you've been reflecting on: "{userLogline}".
              </Text>
            )}
            {lastQuestOrProgram && (
              <Text style={[styles.bodyText, { color: Colors.light.textSecondary, marginTop: 10 }]}> {/* Corrected: Using textSecondary */}
                How is {lastQuestOrProgram} going?
              </Text>
            )}
            {!userLogline && !lastQuestOrProgram && (
              <Text style={[styles.bodyText, { color: Colors.light.textSecondary, marginTop: 10 }]}> {/* Corrected: Using textSecondary */}
                I am here to listen.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={handleBegin}
        disabled={isProcessing}
      >
        >
        {isProcessing ? (
          // Corrected: Using buttonText (white) for contrast
          <ActivityIndicator color={Colors.light.buttonText} />
        ) : (
          <Text style={styles.buttonText}>
            {isFirstTimeUser ? APP_CONTENT.firstTime.buttonText : APP_CONTENT.returning.buttonText}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundPaper, // Corrected: Using backgroundPaper
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.textPrimary, // Corrected: Using textPrimary
    // fontFamily: 'Inter Tight',
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 50,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    // fontFamily: 'Noto Sans Rounded',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 10,
    // fontFamily: 'Inter Tight',
  },
  disclaimerBox: {
    backgroundColor: Colors.light.backgroundPaperSecondary, // Corrected: Using backgroundPaperSecondary for card-like element
    borderRadius: 15,
    padding: 25,
    marginVertical: 30,
    shadowColor: '#000', // Hardcoded shadow for now, can be replaced by design system shadows later
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'justify',
    // fontFamily: 'Inter Tight',
  },
  button: {
    backgroundColor: Colors.light.brandPrimaryGreen, // Corrected: Using brandPrimaryGreen
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000', // Hardcoded shadow for now, can be replaced by design system shadows later
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    width: '100%',
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.light.buttonText, // Corrected: Using buttonText (white)
    fontSize: 18,
    fontWeight: 'bold',
    // fontFamily: 'Noto Sans Rounded',
  },
});