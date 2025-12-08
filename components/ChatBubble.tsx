    // components/ChatBubble.tsx
    import React from 'react';
    import { View, Text, StyleSheet } from 'react-native';
    import { Colors } from '@/constants/Colors'; // Your custom colors

    type MessageBubbleProps = {
      text: string;
      sender: 'user' | 'ai';
    };

    export function ChatBubble({ text, sender }: MessageBubbleProps) {
      const isUser = sender === 'user';
      const bubbleStyle = isUser ? styles.userBubble : styles.aiBubble;
      const textStyle = isUser ? styles.userText : styles.aiText;

      return (
        <View style={[styles.bubbleContainer, { alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.baseBubble, bubbleStyle]}>
            <Text style={textStyle}>{text}</Text>
          </View>
        </View>
      );
    }

    const styles = StyleSheet.create({
      bubbleContainer: {
        maxWidth: '80%', // Limit bubble width
        marginVertical: 4,
        marginHorizontal: 10,
        // Aligned by parent's alignSelf
      },
      baseBubble: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
      },
      userBubble: {
        backgroundColor: Colors.light.primaryLight, // Your Sprout Green
        borderBottomRightRadius: 2, // Organic, asymmetric feel
      },
      aiBubble: {
        backgroundColor: Colors.light.cardBackground, // Paper-like white
        borderBottomLeftRadius: 2, // Organic, asymmetric feel
      },
      userText: {
        color: Colors.light.text.primary, // Darker text for user messages
        fontSize: 16,
        // fontFamily: 'Inter Tight', // Apply once fonts are loaded
      },
      aiText: {
        color: Colors.light.text.primary, // Darker text for AI messages
        fontSize: 16,
        // fontFamily: 'Inter Tight', // Apply once fonts are loaded
      },
    });
    