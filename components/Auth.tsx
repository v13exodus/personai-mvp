import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';   
import * as WebBrowser from 'expo-web-browser'; // <--- ADD THIS IMPORT
    import * as AuthSession from 'expo-auth-session'; // <--- ADD THIS IMPORT

    WebBrowser.maybeCompleteAuthSession();    

    interface AuthProps {
      onAuthSuccess: () => void;
    }
    
    export default function Auth({ onAuthSuccess }: AuthProps) {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);

      async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) Alert.alert(error.message);
        else onAuthSuccess();
        setLoading(false);
      }

      async function signUpWithEmail() {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) Alert.alert(error.message);
        if (session) Alert.alert('Check your email for the confirmation link!');
        setLoading(false);
      }

      async function signInWithGoogle() {
            setLoading(true);
            const redirectUrl = AuthSession.makeRedirectUri({
              scheme: 'mymirror', // <--- Use the scheme you defined in app.json
            });

            console.log('Redirect URL:', redirectUrl); // <--- LOG THIS TO VERIFY

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl, // <--- USE THE DYNAMICALLY GENERATED URL
                    skipBrowserRedirect: false,
                },
            });
            if (error) Alert.alert(error.message);
            setLoading(false);
        }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Welcome Back!</Text>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setEmail(text)}
              value={email}
              placeholder="email@address.com"
              autoCapitalize={'none'}
            />
          </View>
          <View style={styles.verticallySpaced}>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setPassword(text)}
              value={password}
              secureTextEntry={true}
              placeholder="Password"
              autoCapitalize={'none'}
            />
          </View>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={signInWithEmail} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.verticallySpaced}>
            <TouchableOpacity style={styles.button} onPress={signUpWithEmail} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.verticallySpaced}>
            <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={signInWithGoogle} disabled={loading}>
              <Text style={styles.buttonText}>Sign In with Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        marginTop: 40,
        padding: 12,
        backgroundColor: '#F8F1E3', // Light background from design system
        borderRadius: 8,
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#123122', // Primary text color
        textAlign: 'center',
        marginBottom: 20,
      },
      verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
      },
      mt20: {
        marginTop: 20,
      },
      input: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D5DEC7', // Border subtle
        borderWidth: 1,
        borderRadius: 20, // Input field corner radius
        padding: 15,
        fontSize: 16,
        color: '#123122',
      },
      button: {
        borderRadius: 24, // Button corner radius
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
      },
      primaryButton: {
        backgroundColor: '#1B4D1B', // Brand Primary Green
      },
      googleButton: {
        backgroundColor: '#4CAF50', // Brand Secondary Green (or a dedicated Google color)
      },
      buttonText: {
        color: '#FFFFFF', // Button text color
        fontSize: 18,
        fontWeight: '600', // SemiBold from design system
      },
    });