    // components/MessageList.tsx - Types imported from central file
    import React, { useRef, useEffect } from 'react';
    import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
    import { ChatBubble } from './ChatBubble';
    import { UIMessage } from '../types/chat'; // <--- NEW: Import UIMessage from central types
    import { Colors } from '@/constants/Colors';

    type MessageListProps = {
      messages: UIMessage[];
      isSending: boolean;
    };

    export function MessageList({ messages, isSending }: MessageListProps) {
      const scrollViewRef = useRef<ScrollView>(null);

      useEffect(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, [messages]);

      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          ref={scrollViewRef}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} text={msg.text} sender={msg.sender} />
          ))}
          {isSending && (
            <View style={styles.thinkingIndicatorContainer}>
              <ActivityIndicator size="small" color={Colors.light.text.muted} />
              <Text style={styles.thinkingIndicatorText}>PersonAI is thinking...</Text>
            </View>
          )}
        </ScrollView>
      );
    }

    const styles = StyleSheet.create({
      scrollView: {
        flex: 1,
      },
      contentContainer: {
        paddingVertical: 10,
      },
      thinkingIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.light.cardBackground,
        borderRadius: 15,
        borderBottomLeftRadius: 2,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginVertical: 4,
        marginHorizontal: 10,
        maxWidth: '80%',
      },
      thinkingIndicatorText: {
        fontSize: 14,
        color: Colors.light.text.muted,
        marginLeft: 8,
      },
    });
    