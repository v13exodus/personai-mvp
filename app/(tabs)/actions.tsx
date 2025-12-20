import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import supabase from '../../supabaseConfig'; 

// --- NOTIFICATION CONFIG (Mobile Only) ---
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

type ActionItem = {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  scheduled_at?: string;
  reminder_policy?: 'standard' | 'persistent' | 'aggressive';
};

export default function ActionScreen() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. INIT & PERMISSIONS
  useEffect(() => {
    registerForPushNotificationsAsync();
    fetchActions();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:actions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'actions' }, fetchActions)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchActions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setActions(data);
      scheduleNags(data); // Sync local notifications
    }
    setLoading(false);
  };

  // 2. NAG ENGINE (Local Notifications - Mobile Only)
  const scheduleNags = async (items: ActionItem[]) => {
    // GUARD: Web browsers cannot schedule local notifications
    if (Platform.OS === 'web') return;

    try {
      // Clear old schedules to prevent duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      const pending = items.filter(i => i.status === 'pending' && i.scheduled_at);

      for (const item of pending) {
        if (!item.scheduled_at) continue;
        const triggerDate = new Date(item.scheduled_at);
        if (triggerDate < new Date()) continue; // Skip past

        // Policy: STANDARD (1 alert)
        await Notifications.scheduleNotificationAsync({
          content: { title: "Action Required", body: item.title },
          trigger: triggerDate,
        });

        // Policy: PERSISTENT (Add follow-ups)
        if (item.reminder_policy === 'persistent' || item.reminder_policy === 'aggressive') {
          await Notifications.scheduleNotificationAsync({
            content: { title: "Reminder", body: `Still pending: ${item.title}` },
            trigger: new Date(triggerDate.getTime() + 30 * 60000), // +30 mins
          });
        }

        // Policy: AGGRESSIVE (Nag every 10 mins)
        if (item.reminder_policy === 'aggressive') {
          for (let i = 1; i <= 3; i++) {
             await Notifications.scheduleNotificationAsync({
              content: { title: "DO IT NOW", body: `Stop procrastinating: ${item.title}` },
              trigger: new Date(triggerDate.getTime() + (i * 10) * 60000),
            });
          }
        }
      }
    } catch (e) {
      console.log('Notification scheduling skipped:', e);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('actions').insert({ 
      title: newTask, 
      user_id: user.id,
      reminder_policy: 'standard' // Default for manual entry
    });
    setNewTask('');
    // Realtime sub will catch the update
  };

  const toggleAction = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    // Optimistic UI
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    await supabase.from('actions').update({ status: newStatus }).eq('id', id);
    // Re-sync notifications (removes nag if completed)
    fetchActions(); 
  };

  const deleteAction = async (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
    await supabase.from('actions').delete().eq('id', id);
  };

  // --- RENDER ---
  const renderItem = ({ item }: { item: ActionItem }) => {
    const isCompleted = item.status === 'completed';
    const isAggressive = item.reminder_policy === 'aggressive';

    return (
      <View style={[styles.itemContainer, isAggressive && !isCompleted && styles.aggressiveBorder]}>
        <TouchableOpacity style={styles.checkButton} onPress={() => toggleAction(item.id, item.status)}>
          <Ionicons 
            name={isCompleted ? "checkbox" : "square-outline"} 
            size={24} 
            color={isCompleted ? "#6A7D6A" : (isAggressive ? "#D32F2F" : "#1B4D1B")} 
          />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemText, isCompleted && styles.completedText]}>{item.title}</Text>
          {item.description && <Text style={styles.descText}>{item.description}</Text>}
          {item.scheduled_at && !isCompleted && (
             <Text style={styles.timeText}>
               Due: {new Date(item.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               {isAggressive && " (URGENT)"}
             </Text>
          )}
        </View>

        <TouchableOpacity onPress={() => deleteAction(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Actions</Text>
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New action..."
          placeholderTextColor="#6A7D6A"
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={addTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color="#1B4D1B" />
      ) : (
        <FlatList
          data={actions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending actions.</Text>}
        />
      )}
    </View>
  );
}

// 3. PERMISSIONS HELPER
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return; // GUARD: No push on web yet

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E3', paddingTop: 60, paddingHorizontal: 20 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#123122', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  input: { flex: 1, backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, fontSize: 16, color: '#123122', elevation: 2 },
  addButton: { backgroundColor: '#1B4D1B', width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  aggressiveBorder: { borderWidth: 1, borderColor: '#D32F2F', backgroundColor: '#FFF5F5' },
  checkButton: { marginRight: 15 },
  itemText: { fontSize: 16, color: '#123122', fontWeight: '500' },
  descText: { fontSize: 12, color: '#666', marginTop: 2 },
  timeText: { fontSize: 12, color: '#D32F2F', marginTop: 4, fontWeight: 'bold' },
  completedText: { textDecorationLine: 'line-through', color: '#6A7D6A' },
  emptyText: { textAlign: 'center', color: '#6A7D6A', marginTop: 40, fontStyle: 'italic' },
});