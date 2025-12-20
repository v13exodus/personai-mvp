import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import supabase from '../../supabaseConfig';
import ProfileCard from '@/components/ProfileCard'; // Keep your existing component if you wish

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // HUD State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [mission, setMission] = useState<any>(null);
  const [pendingActions, setPendingActions] = useState(0);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email);

      // 1. Get Chat Logline (From most recent active conversation)
      const { data: conv } = await supabase
        .from('conversations')
        .select('summary')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conv?.summary?.current_topic) {
        setTopic(conv.summary.current_topic);
      } else {
        setTopic("Awaiting initialization...");
      }

      // 2. Get Active Mission
      const { data: activeMission } = await supabase
        .from('missions')
        .select('title, current_level') 
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      setMission(activeMission);

      // 3. Get Action Count
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#1B4D1B" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ProfileCard userEmail={userEmail} />

      {/* 1. THE SIGNAL (Chat Summary) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="radio-outline" size={18} color="#6A7D6A" />
          <Text style={styles.sectionTitle}>CURRENT SIGNAL</Text>
        </View>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <Text style={styles.signalText}>
            {topic || "No active signal. Initiate dialogue."}
          </Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Open Channel</Text>
            <Ionicons name="arrow-forward" size={14} color="#1B4D1B" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. THE MISSION (Curriculum) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="map-outline" size={18} color="#6A7D6A" />
          <Text style={styles.sectionTitle}>ACTIVE PROTOCOL</Text>
        </View>
        
        {mission ? (
          <TouchableOpacity 
            style={[styles.card, styles.missionCard]}
            onPress={() => router.push('/(tabs)/missions')}
          >
            <View>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <Text style={styles.missionLevel}>Level {mission.current_level}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={32} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.card, styles.inactiveCard]}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={styles.inactiveText}>No Active Mission</Text>
            <Text style={styles.inactiveSub}>Consult AI to build curriculum.</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. THE GRIND (Actions) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkbox-outline" size={18} color="#6A7D6A" />
          <Text style={styles.sectionTitle}>PENDING ACTIONS</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/(tabs)/actions')}
        >
          <View style={styles.actionRow}>
            <Text style={styles.actionCount}>{pendingActions}</Text>
            <Text style={styles.actionLabel}>Tasks Remaining</Text>
          </View>
          {pendingActions > 0 && (
             <Text style={styles.actionUrgent}>Execute now.</Text>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F1E3',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6A7D6A',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  signalText: {
    fontSize: 18,
    color: '#123122',
    fontStyle: 'italic',
    marginBottom: 15,
    lineHeight: 24,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B4D1B',
  },
  missionCard: {
    backgroundColor: '#1B4D1B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  missionLevel: {
    fontSize: 14,
    color: '#A5D6A7',
    marginTop: 4,
  },
  inactiveCard: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#999',
  },
  inactiveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  inactiveSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  actionCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#123122',
  },
  actionLabel: {
    fontSize: 16,
    color: '#666',
  },
  actionUrgent: {
    marginTop: 5,
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
});