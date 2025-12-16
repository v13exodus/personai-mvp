import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

interface ProfileCardProps {
  userEmail?: string | null;
}

export default function ProfileCard({ userEmail }: ProfileCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Get initials for the avatar (e.g., "j@gmail.com" -> "J")
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      Alert.alert('Logout Error', error.message);
    } else {
      // Router will handle the redirect based on auth state change in index.tsx
      // But we force a replace here to be sure
      router.replace('/'); 
    }
  };

  const handlePayment = () => {
    Alert.alert('Premium Access', 'Payment gateway coming soon.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => Alert.alert('Notice', 'Account deletion feature in progress.') 
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Top Row: Identity */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Welcome Back</Text>
          <Text style={styles.userEmail}>{userEmail || 'Loading...'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom Row: Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePayment}>
          <Text style={styles.actionText}>Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer: Danger Zone */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 15,
    marginTop: 20,
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1B4D1B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#123122',
  },
  userEmail: {
    fontSize: 14,
    color: '#6A7D6A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F3E9D7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#486356',
  },
  actionText: {
    color: '#123122',
    fontWeight: '600',
    fontSize: 13,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    alignItems: 'center',
    paddingTop: 5,
  },
  deleteText: {
    color: '#D32F2F',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});