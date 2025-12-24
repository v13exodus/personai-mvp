/* [FILE: chat.tsx] */
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, KeyboardAvoidingView, Platform, Dimensions, NativeSyntheticEvent, TextInputKeyPressEventData 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

const THRESHOLD_OPENER = "Time is the only resource we cannot negotiate. You have 30 minutes of focused clarity today. This window only opens for those ready to move. If you are here to do the work, say HI.";
const CANONICAL_OPENER = "I'm here. Tell me the person, character, or book whose essence you'd like me to carry — and we’ll begin.";

type Message = { id: string; content: string; role: 'user' | 'assistant'; created_at: string; };

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitiated, setIsInitiated] = useState(false);
  const [seconds, setSeconds] = useState(1800); 
  const [systemError, setSystemError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        setChatHistory(data);
        setIsInitiated(true);
      }
    };
    initializeChat();
  }, []);

  useEffect(() => {
    if (isInitiated && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isInitiated]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!message.trim() || !userId || loading || (isInitiated && seconds <= 0)) return;
    
    const userText = message.trim();
    setMessage('');
    setLoading(true);

    if (!isInitiated && userText.toUpperCase() === 'HI') {
      setIsInitiated(true);
    }

    const tempId = `u-${Date.now()}`;
    setChatHistory(prev => [{ id: tempId, content: userText, role: 'user', created_at: new Date().toISOString() }, ...prev]);

    try {
      // FIX 401: Get session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/chat-turn`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${token}` // Critical for Edge Function Auth
        },
        body: JSON.stringify({
          message: userText,
          user_id: userId,
          history: chatHistory.slice(0, 10).map(m => ({ role: m.role, content: m.content })).reverse()
        }),
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const result = await response.json();
      setChatHistory(prev => [{ id: `ai-${Date.now()}`, content: result.content, role: 'assistant', created_at: new Date().toISOString() }, ...prev]);
    } catch (err: any) {
      setSystemError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter Key for Web and Mobile
  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (IS_WEB && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const intensity = isInitiated ? Math.sin(((1800 - seconds) / 1800) * Math.PI) : 0.1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webWrapper}>
        <View style={[styles.glow, { opacity: intensity * 0.4 }]} />

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.header}>
            <Text style={[styles.timerText, seconds < 60 && isInitiated && { color: '#FF4444' }]}>
              {isInitiated ? formatTime(seconds) : "--:--"}
            </Text>
            {systemError && <Text style={{ color: 'red', fontSize: 10 }}>{systemError}</Text>}
          </View>

          <FlatList
            data={chatHistory}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.listContent}
            ListFooterComponent={() => (
              <View>
                <Text style={styles.thresholdText}>{THRESHOLD_OPENER}</Text>
                {isInitiated && <Text style={styles.canonicalText}>{CANONICAL_OPENER}</Text>}
              </View>
            )}
            renderItem={({ item }) => (
              <View style={[styles.messageWrapper, item.role === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.aiText]}>
                  {item.content}
                </Text>
              </View>
            )}
          />

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                value={message} 
                onChangeText={setMessage} 
                placeholder={seconds > 0 ? "Speak..." : "Window closed."}
                placeholderTextColor="#666"
                editable={!loading && (seconds > 0 || !isInitiated)}
                multiline
                onKeyPress={handleKeyPress} // For Web Enter Key
                onSubmitEditing={IS_WEB ? undefined : handleSend} // For Mobile Enter Key
                blurOnSubmit={false}
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={!message.trim() || loading}>
                <Ionicons name="arrow-up" size={24} color={isInitiated ? "#FFF" : "#666"} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  webWrapper: {
    flex: 1,
    width: IS_WEB ? 500 : '100%',
    alignSelf: 'center',
    backgroundColor: '#000',
    borderLeftWidth: IS_WEB ? 1 : 0,
    borderRightWidth: IS_WEB ? 1 : 0,
    borderColor: '#222',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4466FF',
    borderRadius: width,
    transform: [{ scale: 1.5 }],
    opacity: 0,
  },
  header: { paddingVertical: 20, alignItems: 'center', zIndex: 10 },
  timerText: { color: '#FFF', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  thresholdText: { color: '#666', fontSize: 16, lineHeight: 24, marginBottom: 30, fontStyle: 'italic' },
  canonicalText: { color: '#AAA', fontSize: 18, lineHeight: 26, marginBottom: 40, fontWeight: '300' },
  messageWrapper: { marginVertical: 12, width: '100%' },
  userWrapper: { alignItems: 'flex-end' },
  aiWrapper: { alignItems: 'flex-start' },
  messageText: { fontSize: 17, lineHeight: 24 },
  userText: { color: '#FFF', textAlign: 'right' },
  aiText: { color: '#CCC', textAlign: 'left' },
  inputWrapper: { padding: 20, borderTopWidth: 1, borderTopColor: '#111' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, color: '#FFF', fontSize: 18, paddingVertical: 10, maxHeight: 150 },
  sendButton: { paddingBottom: 8, paddingLeft: 10 },
});