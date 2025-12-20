import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../../supabaseConfig';
import { useRouter } from 'expo-router';

// Types matching your DB and JSON structure
type Level = {
  level: number;
  name: string;
  focus: string;
  micro_actions: string[]; // These are the tasks for this level
};

type Mission = {
  id: string;
  title: string;
  description: string;
  protocol: string; // The "Rules of Engagement"
  current_level: number;
  levels: Level[]; // The JSON array
  status: 'active' | 'completed' | 'archived';
};

export default function MissionScreen() {
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveMission = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch the single active mission
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) console.error('Error fetching mission:', error);
      setMission(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveMission();
    
    // Subscribe to level changes (e.g. if AI upgrades you while you're watching)
    const subscription = supabase
      .channel('public:missions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'missions' }, fetchActiveMission)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [fetchActiveMission]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveMission();
  };

  // --- STATE 1: LOADING ---
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1B4D1B" />
      </View>
    );
  }

  // --- STATE 2: NO ACTIVE MISSION (LOCKED) ---
  if (!mission) {
    return (
      <View style={[styles.container, styles.center, { padding: 30 }]}>
        <Ionicons name="lock-closed" size={64} color="#6A7D6A" style={{ marginBottom: 20 }} />
        <Text style={styles.lockedTitle}>Mission Control Locked</Text>
        <Text style={styles.lockedText}>
          No active mission detected. Consult the AI in Chat to design your curriculum.
        </Text>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <Text style={styles.chatButtonText}>Initiate Protocol</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- STATE 3: ACTIVE MISSION DASHBOARD ---
  const levels = mission.levels || [];
  const totalLevels = levels.length;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.missionLabel}>CURRENT MISSION</Text>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <Text style={styles.missionDesc}>{mission.description}</Text>
        
        {/* THE PROTOCOL CARD */}
        <View style={styles.protocolCard}>
            <Text style={styles.protocolLabel}>THE PROTOCOL</Text>
            <Text style={styles.protocolText}>{mission.protocol}</Text>
        </View>

        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            Level {mission.current_level} / {totalLevels}
          </Text>
        </View>
      </View>

      {/* Curriculum Timeline */}
      <View style={styles.timeline}>
        {levels.map((level, index) => {
          const levelNum = level.level; // Use the actual level number from JSON
          const isPast = levelNum < mission.current_level;
          const isCurrent = levelNum === mission.current_level;
          const isLocked = levelNum > mission.current_level;

          return (
            <View key={index} style={[styles.levelCard, isCurrent && styles.activeCard]}>
              <View style={styles.levelHeader}>
                <View style={[
                  styles.iconBox, 
                  isPast ? styles.iconDone : (isCurrent ? styles.iconActive : styles.iconLocked)
                ]}>
                  <Ionicons 
                    name={isPast ? "checkmark" : (isLocked ? "lock-closed" : "flag")} 
                    size={18} 
                    color={isCurrent ? "#FFF" : "#1B4D1B"} 
                  />
                </View>
                <Text style={[styles.levelTitle, isCurrent && styles.activeTitle]}>
                  Level {levelNum}: {level.name}
                </Text>
              </View>

              {/* Only show details if it's the current level */}
              {isCurrent && (
                <View style={styles.currentDetails}>
                  <Text style={styles.focusLabel}>FOCUS:</Text>
                  <Text style={styles.focusText}>{level.focus}</Text>
                  
                  <View style={styles.infoBox}>
                    <Ionicons name="list" size={16} color="#5D4037" style={{marginRight: 6}} />
                    <Text style={styles.infoText}>
                      Tasks loaded in Actions Tab.
                    </Text>
                  </View>
                </View>
              )}

              {isLocked && <Text style={styles.lockedLabel}>Restricted Access</Text>}
            </View>
          );
        })}
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
  },
  // Locked State
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#123122',
    marginBottom: 10,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 16,
    color: '#6A7D6A',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  chatButton: {
    backgroundColor: '#1B4D1B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Active State
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  missionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6A7D6A',
    letterSpacing: 1,
    marginBottom: 5,
  },
  missionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#123122',
    marginBottom: 10,
  },
  missionDesc: {
    fontSize: 16,
    color: '#486356',
    lineHeight: 22,
    marginBottom: 15,
  },
  protocolCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#1B4D1B'
  },
  protocolLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1B4D1B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  protocolText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 20
  },
  progressBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  progressText: {
    color: '#1B4D1B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeline: {
    padding: 20,
    paddingBottom: 40,
  },
  levelCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCard: {
    borderColor: '#1B4D1B',
    backgroundColor: '#FFF',
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconDone: {
    backgroundColor: '#E0E0E0',
  },
  iconActive: {
    backgroundColor: '#1B4D1B',
  },
  iconLocked: {
    backgroundColor: '#F5F5F5',
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A7D6A',
  },
  activeTitle: {
    color: '#123122',
    fontWeight: 'bold',
  },
  currentDetails: {
    marginTop: 15,
    marginLeft: 44, // Align with text, not icon
  },
  focusLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6A7D6A',
    marginBottom: 4,
  },
  focusText: {
    fontSize: 15,
    color: '#123122',
    marginBottom: 10,
    lineHeight: 20,
  },
  infoBox: {
    marginTop: 15,
    backgroundColor: '#F3E9D7',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoText: {
    fontSize: 12,
    color: '#5D4037',
    fontStyle: 'italic',
  },
  lockedLabel: {
    marginTop: 5,
    marginLeft: 44,
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
});