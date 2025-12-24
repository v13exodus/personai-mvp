// functions/missions.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

type SyllabusLevel = {
  level: number;
  title: string;
  protocol: string;
  directive: string;
  growth_goals: string[];
};

type Mission = {
  id: string;
  title: string;
  description: string;
  current_level: number;
  curriculum: { levels: SyllabusLevel[] };
  status: 'active' | 'aborted';
};

export default function MissionScreen() {
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMission = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('missions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
    setMission(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchMission();
    const sub = supabase.channel('public:missions').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'missions' }, fetchMission).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchMission]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#1B4D1B" /></View>;

  if (!mission) return (
    <View style={[styles.center, { padding: 40 }]}>
      <Ionicons name="lock-closed-outline" size={48} color="#D1C7B7" />
      <Text style={styles.lockedTitle}>NO ACTIVE SYLLABUS</Text>
      <TouchableOpacity style={styles.chatButton} onPress={() => router.push('/(tabs)/chat')}>
        <Text style={styles.chatButtonText}>ENTER THE FORGE</Text>
      </TouchableOpacity>
    </View>
  );

  const levels = mission.curriculum?.levels || [];
  const currentLevelData = levels.find(l => l.level === mission.current_level);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMission} />}>
      <View style={styles.header}>
        <Text style={styles.missionLabel}>MISSION SYLLABUS</Text>
        <Text style={styles.missionTitle}>{mission.title.toUpperCase()}</Text>
        <Text style={styles.missionDesc}>{mission.description}</Text>
        
        {currentLevelData && (
          <View style={styles.activeProtocolCard}>
            <Text style={styles.protocolLabel}>CURRENT LEVEL PROTOCOL (THE LAW)</Text>
            <Text style={styles.protocolText}>"{currentLevelData.protocol}"</Text>
          </View>
        )}
      </View>

      <View style={styles.timeline}>
        {levels.map((lvl, index) => {
          const isCurrent = lvl.level === mission.current_level;
          const isLocked = lvl.level > mission.current_level;

          return (
            <View key={index} style={[styles.levelCard, isCurrent && styles.activeCard, isLocked && styles.lockedCard]}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelNumber}>LEVEL 0{lvl.level}</Text>
                <Text style={styles.levelTitle}>{lvl.title}</Text>
                {isLocked && <Ionicons name="lock-closed" size={14} color="#D1C7B7" />}
              </View>

              {isCurrent && (
                <View style={styles.currentDetails}>
                  <Text style={styles.label}>DIRECTIVE</Text>
                  <Text style={styles.directiveText}>{lvl.directive}</Text>
                  
                  <Text style={[styles.label, { marginTop: 15 }]}>GROWTH GOALS (AUDIT CRITERIA)</Text>
                  {lvl.growth_goals.map((g, i) => (
                    <Text key={i} style={styles.goalText}>• {g}</Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E3' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 30, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E0D5' },
  missionLabel: { fontSize: 10, fontWeight: 'bold', color: '#6A7D6A', letterSpacing: 3, marginBottom: 8 },
  missionTitle: { fontSize: 22, fontWeight: 'bold', color: '#123122', marginBottom: 12 },
  missionDesc: { fontSize: 14, color: '#486356', lineHeight: 20, marginBottom: 20 },
  activeProtocolCard: { backgroundColor: '#123122', padding: 20, borderRadius: 2 },
  protocolLabel: { fontSize: 8, fontWeight: 'bold', color: '#A5D6A7', marginBottom: 6, letterSpacing: 1 },
  protocolText: { fontSize: 14, color: '#FFF', fontStyle: 'italic' },
  timeline: { padding: 20 },
  levelCard: { backgroundColor: '#FFF', padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#E5E0D5' },
  activeCard: { borderColor: '#1B4D1B', borderWidth: 2 },
  lockedCard: { opacity: 0.5 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelNumber: { fontSize: 9, fontWeight: 'bold', color: '#6A7D6A' },
  levelTitle: { fontSize: 16, fontWeight: 'bold', color: '#123122' },
  currentDetails: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#EEE' },
  label: { fontSize: 8, fontWeight: 'bold', color: '#1B4D1B', letterSpacing: 1, marginBottom: 4 },
  directiveText: { fontSize: 14, color: '#123122', fontStyle: 'italic' },
  goalText: { fontSize: 13, color: '#486356', marginTop: 4 },
  chatButton: { marginTop: 20, backgroundColor: '#1B4D1B', padding: 15, paddingHorizontal: 30 },
  chatButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  lockedTitle: { fontSize: 12, fontWeight: 'bold', color: '#123122', letterSpacing: 2 }
});