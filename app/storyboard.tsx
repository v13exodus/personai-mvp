// app/storyboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import StoryPanel from '../components/StoryPanel';

export default function StoryboardScreen() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<{type: string, text: string}[]>([]);

  useEffect(() => {
    const fetchStory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conv } = await supabase
        .from('conversations')
        .select('state_json')
        .eq('user_id', user.id)
        .maybeSingle();

      const story = [
        ...(conv?.state_json?.dismantled_excuses?.map((e: string) => ({ type: 'breakthrough', text: e })) || []),
        ...(conv?.state_json?.mission_milestones?.map((m: string) => ({ type: 'milestone', text: m })) || [])
      ];
      setMilestones(story);
    };
    fetchStory();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>THE CHRONICLE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {milestones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>The void is silent.</Text>
            <Text style={styles.emptySub}>Earn your story in the Forge.</Text>
          </View>
        ) : (
          milestones.map((item, index) => (
            <StoryPanel key={index} index={index} type={item.type} text={item.text} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' }, // True black background
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingHorizontal: 20, 
    justifyContent: 'space-between',
    marginBottom: 30
  },
  headerTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 5, color: '#6A7D6A' },
  scrollBody: { alignItems: 'center', paddingBottom: 50 },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#FFF', fontSize: 20, fontStyle: 'italic', opacity: 0.5 },
  emptySub: { color: '#6A7D6A', fontSize: 12, marginTop: 10, letterSpacing: 2 }
});