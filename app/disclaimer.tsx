    // app/disclaimer.tsx
    import React from 'react';
    import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
    import { useRouter } from 'expo-router';
    import { Colors } from '@/constants/Colors';
    import supabase from '../supabaseConfig'; // Import Supabase client

    export default function MedicalDisclaimerScreen() {
      const router = useRouter();

          // app/disclaimer.tsx (excerpt - replace just the handleBegin function)
    const handleBegin = async () => {
        if (!supabase) {
          Alert.alert("Initialization Error", "Supabase is not fully initialized. Please try restarting the app or check your internet connection.");
          console.error("Supabase client is null. Cannot proceed with disclaimer acceptance.");
          return;
        }
        try {
          // 1. Authenticate ANONYMOUSLY when the button is clicked (this is the key change!)
          const { data, error: authError } = await supabase.auth.signInAnonymously();

          if (authError) {
            throw authError; // Throw the actual auth error
          }
          if (!data.user) {
              throw new Error("Anonymous sign-in did not return a user."); // Should not happen if authError is null
          }

          const user = data.user; // This is the newly (or re-) authenticated user
          console.log("Authenticated User ID (Supabase):", user.id);

          // 2. Record consent by UPDATING the existing user_profiles entry
          //    (AuthFlowGate in app/index.tsx ensures a profile with hasAcceptedDisclaimer:false already exists)
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ hasAcceptedDisclaimer: true })
            .eq('id', user.id); // Update the profile belonging to this user
            
          if (updateError) {
            throw updateError;
          }
          console.log(`Disclaimer accepted and recorded (updated profile) for user ${user.id}.`);

          // 3. Navigate to Chat Tab
          router.replace('/(tabs)');
        } catch (error: any) {
          Alert.alert("Action Error", error.message);
          console.error("Error during authentication or consent recording (Supabase):", error);
        }
      };
    // ... rest of the component
    
      return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
          <Text style={[styles.title, { color: Colors.light.text }]}>
            Important: Read Before You Begin
          </Text>

          <View style={styles.disclaimerBox}>
            <Text style={[styles.disclaimerText, { color: Colors.light.secondaryText }]}>
              PersonAI is a generative AI and is not a therapist or a medical professional.
              Our conversations are designed for self-reflection and are not a substitute
              for professional advice. All conversations are private and secure.
            </Text>
            <Text style={[styles.disclaimerText, { color: Colors.light.secondaryText, marginTop: 15 }]}>
              By clicking "I Understand and Agree & Begin", you understand and agree to these terms.
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleBegin}>
            <Text style={styles.buttonText}>I Understand and Agree & Begin</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 40,
        paddingTop: 80,
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        // fontFamily: 'Noto Sans Rounded', // Will use this once fonts are loaded
      },
      disclaimerBox: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: 15,
        padding: 25,
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
      },
      disclaimerText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'justify',
        // fontFamily: 'Inter Tight',
      },
      button: {
        backgroundColor: Colors.light.tint,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
      },
      buttonText: {
        color: Colors.light.cardBackground,
        fontSize: 18,
        fontWeight: 'bold',
        // fontFamily: 'Noto Sans Rounded',
      },
    });
    