import React, { useState } from 'react';
import { Text, View, Button, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

export default function DisclaimerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No user found");

      // FIX: Use upsert to create the row if it's missing
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: session.user.id, has_accepted_disclaimer: true });

      if (error) throw error;

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  const performDelete = async () => {
    try {
        await supabase.rpc('delete_user');
        await supabase.auth.signOut();
        router.replace('/');
    } catch (e) { console.error(e) }
  };

  const handleDecline = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Delete account?")) performDelete();
    } else {
      Alert.alert("Delete Account", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete }
      ]);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{flex:1}} />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F1E3', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#123122', marginBottom: 20 }}>Disclaimer</Text>
      <Text style={{ fontSize: 16, color: '#486356', textAlign: 'center', marginBottom: 40 }}>
        By continuing, you agree to our Terms.
      </Text>
      <View style={{ width: '100%', gap: 15 }}>
        <Button title="I Consent & Continue" onPress={handleConsent} color="#1B4D1B" />
        <Button title="Decline & Delete Account" onPress={handleDecline} color="#D32F2F" />
      </View>
    </View>
  );
}