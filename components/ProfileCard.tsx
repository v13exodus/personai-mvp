import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  ActivityIndicator, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; // <--- Import this
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

interface ProfileCardProps {
  userEmail?: string | null;
  avatarUrl?: string | null;
  fullName?: string | null;
  onProfileUpdate?: () => void;
}

export default function ProfileCard({ userEmail, avatarUrl, fullName, onProfileUpdate }: ProfileCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const displayName = fullName || "OPERATOR";
  const initial = displayName.charAt(0).toUpperCase();

  // --- IMAGE UPLOAD ---
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadAvatar(result.assets[0].base64);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const uploadAvatar = async (base64Data: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileName = `${user.id}/avatar.png`; // Overwrite same file to save space
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64Data), {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Force refresh of the URL by appending timestamp
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update User Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: `${publicUrl}?t=${Date.now()}` }
      });

      if (updateError) throw updateError;

      if (onProfileUpdate) onProfileUpdate(); 

    } catch (e: any) {
      console.log(e);
      Alert.alert("Upload Failed", "Ensure 'avatars' bucket is Public in Supabase.");
    } finally {
      setUploading(false);
    }
  };

  // --- DELETE ACCOUNT ---
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'WARNING: This will wipe all missions, logs, and personality data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'DELETE EVERYTHING', 
          style: 'destructive', 
          onPress: async () => {
            setLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // 1. Manual Cascade Delete
                await supabase.from('actions').delete().eq('user_id', user.id);
                await supabase.from('missions').delete().eq('user_id', user.id);
                await supabase.from('conversations').delete().eq('user_id', user.id);
                await supabase.from('profiles').delete().eq('id', user.id);
                
                // 2. Sign Out
                await supabase.auth.signOut();
                router.replace('/');
              }
            } catch (e) {
              Alert.alert("Error", "Could not delete account. Try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace('/'); 
    setLoading(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="camera" size={12} color="#FFF" />}
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Subscription", "Coming Soon")}>
          <Text style={styles.actionText}>Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.logoutText}>Log Out</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatarImage: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1B4D1B', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#486356', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#123122' },
  userEmail: { fontSize: 12, color: '#6A7D6A' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 15 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  actionButton: { flex: 1, backgroundColor: '#F3E9D7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  logoutButton: { backgroundColor: '#486356' },
  actionText: { color: '#123122', fontWeight: '600', fontSize: 13 },
  logoutText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  deleteButton: { alignItems: 'center' },
  deleteText: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold' },
});