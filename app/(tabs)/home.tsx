import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, RefreshControl, Dimensions, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State Data
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [logline, setLogline] = useState<string | null>(null);
  const [mission, setMission] = useState<any>(null);
  const [pendingActions, setPendingActions] = useState(0);

  // UI Animation State
  const menuExpanded = useSharedValue(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserEmail(user.email || null);
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      setFullName(user.user_metadata?.full_name || null);

      const { data: conv } = await supabase
        .from('conversations')
        .select('summary')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      // The Logline: Narrative summary of user interaction
      setLogline(conv?.summary?.current_topic || "The signal is silent. Begin the probe.");

      const { data: activeMission } = await supabase
        .from('missions')
        .select('title, current_level') 
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      setMission(activeMission);

      const { count } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      setPendingActions(count || 0);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error", error.message);
    // Navigation is handled by the top-level auth provider
  };

  const toggleMenu = () => {
    const target = isMenuOpen ? 0 : 1;
    menuExpanded.value = withSpring(target, { damping: 15 });
    setIsMenuOpen(!isMenuOpen);
  };

  // Animated Styles
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(menuExpanded.value, [0, 1], [1, 1.2]) }],
    opacity: interpolate(menuExpanded.value, [0, 1], [1, 0.8]),
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: menuExpanded.value,
    transform: [{ translateY: interpolate(menuExpanded.value, [0, 1], [20, 0]) }],
    pointerEvents: isMenuOpen ? 'auto' : 'none',
  }));

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#1B4D1B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#1B4D1B" />}
      >
        {/* 1. THE ESSENCE (AVATAR & HIDDEN SYSTEM) */}
        <View style={styles.avatarSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={toggleMenu}>
            <Animated.View style={[styles.avatarCircle, avatarStyle]}>
              {avatarUrl ? (
                <Animated.Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="aperture-outline" size={60} color="#1B4D1B" />
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* HIDDEN SYSTEM LAYER */}
          <Animated.View style={[styles.systemMenu, menuStyle]}>
            <Text style={styles.userEmail}>{userEmail}</Text>
            <View style={styles.systemRow}>
              <TouchableOpacity style={styles.systemBtn} onPress={() => {/* Sub Logic */}}>
                <Ionicons name="key-outline" size={20} color="#6A7D6A" />
                <Text style={styles.systemBtnText}>Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.systemBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#6A7D6A" />
                <Text style={styles.systemBtnText}>Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.systemBtn} onPress={() => {/* Delete Logic */}}>
                <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                <Text style={[styles.systemBtnText, {color: '#D32F2F'}]}>Void</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* 2. THE LOGLINE (User's Interaction Summary) */}
        <View style={styles.signalSection}>
          <Text style={styles.signalLabel}>CURRENT LOGLINE</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/chat')}>
            <Text style={styles.signalText}>"{logline}"</Text>
          </TouchableOpacity>
        </View>

        {/* 3. THE CHRONICLE (Storyboard Access) */}
        <TouchableOpacity 
          style={styles.storyboardLink} 
          onPress={() => router.push('/storyboard')}
        >
          <Ionicons name="journal-outline" size={16} color="#6A7D6A" />
          <Text style={styles.storyboardText}>VIEW THE CHRONICLE</Text>
        </TouchableOpacity>

        {/* 4. THE WORK (EARNED ACCESS) */}
        <View style={styles.workSection}>
          <TouchableOpacity 
            style={styles.forgeButton} 
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={styles.forgeButtonText}>ENTER THE FORGE</Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statBox} 
              onPress={() => router.push('/(tabs)/actions')}
            >
              <Text style={styles.statValue}>{pendingActions}</Text>
              <Text style={styles.statLabel}>TRIALS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statBox, !mission && { opacity: 0.3 }]} 
              onPress={() => mission && router.push('/(tabs)/missions')}
            >
              <Text style={styles.statValue}>{mission ? mission.current_level : '--'}</Text>
              <Text style={styles.statLabel}>LEVEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E3' },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  // Avatar Section
  avatarSection: { alignItems: 'center', marginBottom: 30, width: '100%' },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#1B4D1B', shadowOpacity: 0.15, shadowRadius: 20 },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  
  // Hidden System Menu
  systemMenu: { marginTop: 20, alignItems: 'center', width: '80%' },
  userEmail: { fontSize: 12, color: '#6A7D6A', marginBottom: 15, letterSpacing: 1 },
  systemRow: { flexDirection: 'row', gap: 20 },
  systemBtn: { alignItems: 'center', gap: 4 },
  systemBtnText: { fontSize: 10, fontWeight: 'bold', color: '#6A7D6A' },

  // Signal Section
  signalSection: { paddingHorizontal: 40, alignItems: 'center', marginBottom: 30 },
  signalLabel: { fontSize: 10, letterSpacing: 3, color: '#6A7D6A', marginBottom: 15, fontWeight: 'bold' },
  signalText: { fontSize: 20, color: '#123122', textAlign: 'center', fontStyle: 'italic', lineHeight: 28 },

  // Storyboard Link
  storyboardLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 50, borderBottomWidth: 1, borderBottomColor: '#E5E0D5', paddingBottom: 5 },
  storyboardText: { fontSize: 11, letterSpacing: 2, color: '#6A7D6A', fontWeight: 'bold' },

  // Work Section
  workSection: { width: '100%', paddingHorizontal: 30, marginTop: 'auto' },
  forgeButton: { backgroundColor: '#1B4D1B', paddingVertical: 20, borderRadius: 2, alignItems: 'center', marginBottom: 20 },
  forgeButtonText: { color: '#FFF', letterSpacing: 4, fontWeight: 'bold', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  statBox: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 2, alignItems: 'center', borderWidth: 1, borderColor: '#E5E0D5' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#123122' },
  statLabel: { fontSize: 10, letterSpacing: 2, color: '#6A7D6A', marginTop: 4 }
});