    // app/welcome.tsx
    import React from 'react';
    import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
    import { useRouter } from 'expo-router';
    import { Colors } from '@/constants/Colors';

    // The component itself must be the default export at the top level
    export default function WelcomeScreen() {
      const router = useRouter();

      const handleBegin = () => {
        // --- IMPORTANT: AUTHENTICATION WILL GO HERE ---
        // For now, it will navigate to the disclaimer screen.
        // The disclaimer screen will then handle the initial anonymous auth.
        router.replace('/disclaimer');
      };

      return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
          <Text style={[styles.title, { color: Colors.light.text }]}>
            Welcome to PersonAI
          </Text>
          <Text style={[styles.subtitle, { color: Colors.light.earthBrown }]}>
            Your Mirror-Mentor for Identity Transformation
          </Text>

          {/* Placeholder for Dynamic Blossom Logo */}
          <View style={styles.logoPlaceholder}>
            <Text style={{ color: Colors.light.text }}>[Dynamic Blossom Logo Here]</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleBegin}>
            <Text style={styles.buttonText}>Begin Your Journey</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around', // Distribute items vertically
        padding: 40,
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        // fontFamily: 'Noto Sans Rounded', // Will use this once fonts are loaded
      },
      subtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 40,
        // fontFamily: 'Inter Tight', // Will use this once fonts are loaded
      },
      logoPlaceholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: Colors.light.softGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
      },
      button: {
        backgroundColor: Colors.light.tint, // Using primary green
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30, // More rounded for organic feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
      },
      buttonText: {
        color: Colors.light.cardBackground, // White text on button
        fontSize: 18,
        fontWeight: 'bold',
        // fontFamily: 'Noto Sans Rounded',
      },
    });
    