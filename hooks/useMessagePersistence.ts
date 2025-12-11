    // hooks/useMessagePersistence.ts - Types imported from central file
    import { useCallback } from 'react';
    import { Alert } from 'react-native';
    import supabase from '../supabaseConfig';
    import { UIMessage } from '../types/chat'; // <--- NEW: Import UIMessage from central types

    export function useMessagePersistence() {
      const loadMessages = useCallback(async (userId: string) => {
        console.log("useMessagePersistence: Loading messages from Supabase for user:", userId);
        const { data, error } = await supabase
          .from('conversations')
          .select('id, text, sender, timestamp, message_type, file_url, file_name')
          .eq('user_id', userId)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error("useMessagePersistence: Error loading messages:", error.message);
          Alert.alert("Chat Load Error", "Failed to load previous conversations.");
          return [];
        }

        const loadedMsgs: UIMessage[] = data.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender as ('user' | 'ai'),
          timestamp: new Date(msg.timestamp),
          message_type: msg.message_type || 'text',
          file_url: msg.file_url,
          file_name: msg.file_name,
        }));
        console.log("useMessagePersistence: Loaded messages:", loadedMsgs.length);
        return loadedMsgs;
      }, []);

      const saveMessage = useCallback(async (message: UIMessage, userId: string) => {
        console.log("useMessagePersistence: Saving message to Supabase for user:", userId);
        const messageToSave = {
          id: message.id,
          user_id: userId,
          text: message.text,
          sender: message.sender,
          timestamp: message.timestamp.toISOString(),
          message_type: message.message_type || 'text',
          file_url: message.file_url || null,
          file_name: message.file_name || null,
        };
        const { error } = await supabase
          .from('conversations')
          .insert(messageToSave);
        if (error) {
          console.error("useMessagePersistence: Error saving message:", error.message);
        }
      }, []);

      return { loadMessages, saveMessage };
    }
    