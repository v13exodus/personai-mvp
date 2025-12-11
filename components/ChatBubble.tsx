// components/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '@/constants/Colors'; // Assuming Colors is correctly imported from constants/Colors.ts
import { ExternalLink } from './ExternalLink'; // Assuming you have this component for links

type ChatBubbleProps = {
  text: string;
  sender: 'user' | 'ai';
  fileUrl?: string; // New prop for file URL
  fileType?: 'text' | 'image' | 'audio' | 'document'; // New prop for file type
  fileName?: string; // New prop for file name
};

export function ChatBubble({ text, sender, fileUrl, fileType, fileName }: ChatBubbleProps) {
  const isUser = sender === 'user';

  const handleFilePress = () => {
    if (fileUrl && fileType === 'document') {
      Linking.openURL(fileUrl).catch(err => console.error("Couldn't load page", err));
    }
  };

  return (
    <View style={[styles.bubbleContainer, isUser ? styles.userContainer : styles.aiContainer]}>
      {fileUrl && fileType === 'image' && (
        <Image
          source={{ uri: fileUrl }}
          style={styles.imageAttachment}
          resizeMode="contain"
        />
      )}
      {fileUrl && fileType === 'document' && (
        <TouchableOpacity onPress={handleFilePress} style={styles.documentAttachment}>
          <Text style={styles.documentText}>📄 {fileName || 'Document'}</Text>
          <Text style={styles.documentLink}>Tap to open</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 18, // From app.json: cornerRadius.chatBubbles
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  userContainer: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.chatUserBubble, // Corrected from Colors.light.chatBubbleUser
    borderBottomRightRadius: 2,
  },
  aiContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.chatAssistantBubble, // Corrected from Colors.light.chatBubbleAI
    borderBottomLeftRadius: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    // fontFamily: 'Quicksand_400Regular', // Will apply this once expo-font is set up
  },
  userText: {
    color: Colors.light.buttonText, // Corrected: Using buttonText for inverse color on dark user bubble
  },
  aiText: {
    color: Colors.light.textPrimary, // Corrected: Using textPrimary for text on light AI bubble
  },
  imageAttachment: {
    width: 200, // Or dynamic width based on parent
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentAttachment: {
    backgroundColor: Colors.light.backgroundPaperSecondary, // Corrected: Using a suitable background color
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  documentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.textPrimary, // Corrected: Using textPrimary
  },
  documentLink: {
    fontSize: 12,
    color: Colors.light.tealAccent, // Corrected: Using tealAccent for links
    marginTop: 4,
  }
});