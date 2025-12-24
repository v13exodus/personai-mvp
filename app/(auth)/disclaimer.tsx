import React, { useState } from 'react';
import {
  Text,
  View,
  Button,
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function DisclaimerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConsent = async () => {
    if (!acknowledged) return;

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          has_accepted_disclaimer: true,
        });

      if (error) throw error;

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const performDelete = async () => {
    try {
      await supabase.rpc('delete_user');
      await supabase.auth.signOut();
      router.replace('/');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecline = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete account?')) performDelete();
    } else {
      Alert.alert('Delete Account', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F1E3',
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#123122',
          marginBottom: 20,
        }}
      >
        Disclaimer
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: '#486356',
          textAlign: 'center',
          marginBottom: 30,
        }}
      >
        PersonAI is a conversational thinking tool designed to help you reflect,
        gain perspective, and make decisions.

        {'\n\n'}
        It is not a replacement for professional medical, psychological, legal,
        or therapeutic advice. It does not diagnose conditions or predict
        outcomes.

        {'\n\n'}
        Like all AI systems, PersonAI can make mistakes or produce incomplete or
        imperfect responses. You are responsible for verifying information and
        for all decisions and actions you take.
      </Text>

      {/* Acknowledgement Checkbox */}
      <Pressable
        onPress={() => setAcknowledged(!acknowledged)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 30,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderWidth: 2,
            borderColor: '#1B4D1B',
            marginRight: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: acknowledged ? '#1B4D1B' : 'transparent',
          }}
        >
          {acknowledged && (
            <View
              style={{
                width: 10,
                height: 10,
                backgroundColor: '#FFFFFF',
              }}
            />
          )}
        </View>

        <Text style={{ color: '#123122', fontSize: 14 }}>
          I understand that PersonAI may be incorrect at times and is not a
          substitute for professional advice.
        </Text>
      </Pressable>

      <View style={{ width: '100%', gap: 15 }}>
        <Button
          title="I Consent & Continue"
          onPress={handleConsent}
          color="#1B4D1B"
          disabled={!acknowledged}
        />
        <Button
          title="Decline & Delete Account"
          onPress={handleDecline}
          color="#D32F2F"
        />
      </View>
    </View>
  );
}
