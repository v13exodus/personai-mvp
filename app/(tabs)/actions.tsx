// functions/actions.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Platform, ActivityIndicator, Alert, TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

type ActionItem = {
  id: string;
  title: string;
  description?: string; // This is the physical GOAL
  routine_instruction?: string; // This is the essence ROUTINE
  status: 'pending' | 'in_progress' | 'completed';
  scheduled_at?: string;
  reminder_policy?: 'standard' | 'persistent' | 'aggressive';
  origin?: string; 
  requires_submission?: boolean;
  is_locked?: boolean;
  results_reflection?: string;
  submission_text?: string;
};

export default function ActionScreen() {
  const router = useRouter();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [submission, setSubmission] = useState('');

  useEffect(() => {
    fetchData();
    const subscription = supabase.channel('public:actions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'actions' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: actionData } = await supabase.from('actions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: missionData } = await supabase.from('missions').select('protocol').eq('user_id', user.id).eq('status', 'active').maybeSingle();

    if (actionData) setActions(actionData);
    if (missionData) setProtocol(missionData.protocol);
    setLoading(false);
  };

  const submitToAudit = async (item: ActionItem) => {
    if (!reflection.trim()) {
      Alert.alert("REFLECTION REQUIRED", "The Socratic demands a reflection on your labor before the audit.");
      return;
    }

    const { error } = await supabase.from('actions').update({
      status: 'completed',
      results_reflection: reflection,
      submission_text: submission,
      is_locked: true,
      completed_at: new Date().toISOString()
    }).eq('id', item.id);

    if (!error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("ARTIFACT RECEIVED", "The Registry is locked. The Doctor is waiting in the Review Room.",
        [{ text: "ENTER REVIEW ROOM", onPress: () => router.push('/(tabs)/chat') }]
      );
      setExpandedId(null);
      setReflection('');
      setSubmission('');
      fetchData();
    }
  };

  const renderItem = ({ item }: { item: ActionItem }) => {
    const isCompleted = item.status === 'completed';
    const isLocked = item.is_locked;
    const isTrial = item.origin === 'trial' || item.origin === 'orientation';
    const isExpanded = expandedId === item.id;

    return (
      <View style={[styles.itemContainer, isCompleted && styles.completedContainer, isLocked && styles.lockedContainer]}>
        <View style={styles.mainRow}>
          <TouchableOpacity style={styles.checkButton} onPress={() => !isLocked && setExpandedId(isExpanded ? null : item.id)}>
            <View style={[styles.customCheck, isCompleted && styles.customCheckActive]}>
              {isLocked ? <Ionicons name="lock-closed" size={14} color="#FFF" /> : (isCompleted && <Ionicons name="checkmark" size={16} color="#FFF" />)}
            </View>
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            {isTrial && <Text style={styles.trialLabel}>WORTHINESS TRIAL</Text>}
            <Text style={[styles.itemText, isCompleted && styles.completedText]}>{item.title}</Text>
            {item.description && !isExpanded && <Text style={styles.descText} numberOfLines={1}>{item.description}</Text>}
          </View>
        </View>

        {isExpanded && !isLocked && (
          <View style={styles.formContainer}>
            <View style={styles.intertwinedBox}>
                <Text style={styles.miniLabel}>THE ACTION (GOAL)</Text>
                <Text style={styles.goalText}>{item.description}</Text>
                
                {item.routine_instruction && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.miniLabel}>THE ROUTINE (ESSENCE)</Text>
                    <Text style={styles.routineText}>{item.routine_instruction}</Text>
                  </>
                )}
            </View>
            
            <Text style={styles.label}>RESULTS & REFLECTION</Text>
            <TextInput style={styles.textArea} placeholder="Where did the 'Glitch' appear? How did you inhabit the Persona?" placeholderTextColor="#999" multiline value={reflection} onChangeText={setReflection} />
            
            {item.requires_submission && (
              <>
                <Text style={styles.label}>ARTIFACT SUBMISSION</Text>
                <TextInput style={[styles.textArea, { height: 100 }]} placeholder="Paste your labor/work here..." placeholderTextColor="#999" multiline value={submission} onChangeText={setSubmission} />
              </>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={() => submitToAudit(item)}>
              <Text style={styles.submitBtnText}>SUBMIT FOR AUDIT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>REGISTRY</Text>
          {protocol && <Text style={styles.priceTag}>PROTOCOL: {protocol.toUpperCase()}</Text>}
        </View>
        <Text style={styles.headerCount}>{actions.filter(a => a.status === 'pending').length} ACTIVE</Text>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#1B4D1B" /> : 
        <FlatList data={actions} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 100 }} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Registry Clear.</Text></View>} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E3', paddingTop: 60, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#123122', letterSpacing: 4 },
  headerCount: { fontSize: 10, fontWeight: 'bold', color: '#6A7D6A', letterSpacing: 1 },
  priceTag: { fontSize: 9, color: '#D32F2F', fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  itemContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 2, marginBottom: 12, borderWidth: 1, borderColor: '#E5E0D5' },
  mainRow: { flexDirection: 'row', alignItems: 'center' },
  completedContainer: { backgroundColor: '#F9F9F9', opacity: 0.8 },
  lockedContainer: { backgroundColor: '#F0F0F0' },
  trialLabel: { fontSize: 8, fontWeight: 'bold', color: '#D32F2F', letterSpacing: 2, marginBottom: 6 },
  customCheck: { width: 24, height: 24, borderWidth: 2, borderColor: '#1B4D1B', borderRadius: 2, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  customCheckActive: { backgroundColor: '#1B4D1B' },
  itemText: { fontSize: 16, color: '#123122', fontWeight: '600' },
  descText: { fontSize: 13, color: '#6A7D6A', marginTop: 4, fontStyle: 'italic' },
  completedText: { textDecorationLine: 'line-through', color: '#6A7D6A' },
  formContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#EEE' },
  intertwinedBox: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 2, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  miniLabel: { fontSize: 8, fontWeight: 'bold', color: '#1B4D1B', letterSpacing: 1, marginBottom: 4 },
  goalText: { fontSize: 14, color: '#123122', marginBottom: 10 },
  routineText: { fontSize: 14, color: '#1B4D1B', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#1B4D1B', marginBottom: 8 },
  textArea: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E0D5', padding: 12, fontSize: 14, marginBottom: 15, textAlignVertical: 'top', height: 70 },
  submitBtn: { backgroundColor: '#1B4D1B', padding: 15, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#6A7D6A', fontSize: 14, fontWeight: 'bold' },
  checkButton: { paddingVertical: 5 }
});