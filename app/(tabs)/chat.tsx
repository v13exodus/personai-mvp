import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Alert, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../../supabaseConfig';

// --- TYPES ---
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
};

const THINKING_STATES = [
  "Reflecting...", "Sensing...", "Calibrating...", "Connecting...", 
  "Assimilating...", "Observing...", "Aligning...", "Processing..."
];

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [thinkingText, setThinkingText] = useState('Thinking...');
  const [activeLens, setActiveLens] = useState<string>('Gateway'); 
  const [activeStrategy, setActiveStrategy] = useState<string>('');

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await Promise.all([restoreSession(session.user.id), fetchLens(session.user.id)]);
      } else {
        addSystemMessage("Please sign in to start your journey.");
      }
    };
    init();
  }, []);

  const addSystemMessage = (text: string) => {
    setChatHistory([{ id: 'intro', text, sender: 'ai', timestamp: new Date().toISOString() }]);
  };

  const restoreSession = async (uid: string) => {
    try {
      const { data: convData } = await supabase
        .from('conversations')
        .select('id, summary')
        .eq('user_id', uid)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convData) {
        setConversationId(convData.id);
        if (convData.summary) setSummary(convData.summary);
        await fetchMessages(convData.id);
      } else {
        addSystemMessage("I'm here. Tell me the person, character, or book whose essence you'd like me to carry.");
      }
    } catch (e) { console.log('Error restoring session:', e); }
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const formatted: Message[] = data.map((m: any) => ({
        id: m._id || m.id,
        text: m.text,
        sender: m.is_user ? 'user' : 'ai',
        timestamp: m.created_at
      }));
      setChatHistory(formatted);
      setTurnCount(formatted.length);
    } else {
      addSystemMessage("I'm here. Tell me the person, character, or book whose essence you'd like me to carry.");
    }
  };

  const fetchLens = async (uid: string) => {
    try {
      const { data } = await supabase.from('profiles').select('active_essence_pep').eq('id', uid).maybeSingle();
      if (data?.active_essence_pep) {
        if (typeof data.active_essence_pep === 'object') {
            setActiveLens(data.active_essence_pep.name || 'Gateway');
            setActiveStrategy(data.active_essence_pep.strategy || '');
        } else {
            setActiveLens(data.active_essence_pep);
            setActiveStrategy('');
        }
      }
    } catch (e) { console.log("Lens error", e); }
  };

  const handleSend = async () => {
    if (!message.trim() || !userId) return;
    const userText = message.trim();
    setMessage('');
    setThinkingText(THINKING_STATES[Math.floor(Math.random() * THINKING_STATES.length)]);
    Keyboard.dismiss(); // Optional: Close keyboard on send if you prefer

    const optimisticMsg: Message = { 
      id: Date.now().toString(), text: userText, sender: 'user', timestamp: new Date().toISOString() 
    };
    setChatHistory(prev => [optimisticMsg, ...prev]);
    setTurnCount(prev => prev + 1);
    setLoading(true);

    try {
      let currentConvId = conversationId;
      if (!currentConvId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId, title: userText.substring(0, 30), status: 'active', timestamp: new Date().toISOString(), summary: {}
          })
          .select().single();
        if (convError) throw convError;
        currentConvId = newConv.id;
        setConversationId(newConv.id);
      }

      await supabase.from('messages').insert({
        conversation_id: currentConvId, user_id: userId, text: userText, is_user: true, created_at: new Date().toISOString()
      });

      const contextMessages = chatHistory.slice(0, 15).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant', content: m.text
      })).reverse(); 

      const { data, error } = await supabase.functions.invoke('chat-turn', {
        body: { 
            message: userText, user_id: userId, conversation_id: currentConvId,
            history: contextMessages, lens: activeLens, summary: summary, message_count: turnCount + 1 
        }
      });
      if (error) throw error;
      if (data.summary) setSummary(data.summary);

      const aiMsg: Message = { id: Date.now().toString() + '_ai', text: data.reply, sender: 'ai', timestamp: new Date().toISOString() };
      setChatHistory(prev => [aiMsg, ...prev]);

      await supabase.from('messages').insert({
        conversation_id: currentConvId, user_id: userId, text: data.reply, is_user: false, created_at: new Date().toISOString()
      });
      await fetchLens(userId);

    } catch (err) {
      console.error(err);
      if (Platform.OS !== 'web') Alert.alert("Error", "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.aiRow]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(turnCount * 2, 100)}%`, backgroundColor: turnCount < 10 ? '#4caf50' : '#ff9800' }]} />
          </View>
          <Text style={styles.phaseText}>{activeLens.toUpperCase()}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={chatHistory}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          inverted 
          contentContainerStyle={styles.listContent}
          style={styles.list}
          keyboardDismissMode="on-drag"
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{thinkingText}</Text>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Speak your truth..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!loading}
            />
            <TouchableOpacity onPress={handleSend} disabled={!message.trim() || loading} style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  keyboardContainer: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center', backgroundColor: '#fff' },
  progressBarBg: { height: 3, backgroundColor: '#f0f0f0', width: '100%', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  phaseText: { fontSize: 10, color: '#aaa', marginTop: 8, letterSpacing: 1.5, fontWeight: '600', textTransform: 'uppercase' },
  list: { flex: 1, backgroundColor: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 20 },
  bubbleRow: { marginBottom: 12, flexDirection: 'row', width: '100%' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  userBubble: { backgroundColor: '#1B4D1B', borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: '#F2F2F2', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#000' },
  loadingContainer: { paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { color: '#888', fontSize: 12, fontStyle: 'italic' },
  inputWrapper: { borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff', paddingBottom: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12 },
  input: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, maxHeight: 100, fontSize: 16, color: '#333' },
  sendButton: { backgroundColor: '#1B4D1B', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginBottom: 2 },
  sendButtonDisabled: { backgroundColor: '#ccc' },
});