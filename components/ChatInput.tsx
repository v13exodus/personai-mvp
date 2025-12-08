// components/ChatInput.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Send } from 'lucide-react-native'; // Using lucide-react-native for a simple send icon
import { Colors } from '@/constants/Colors'; // Your custom colors

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  // You could add props for dimming/soft lock here later if needed
};

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage(''); // Clear input after sending
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    // For web, if multiline is true, Enter key usually adds a new line.
    // We want Enter (without Shift) to send the message.
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault(); // Prevent default behavior (e.g., adding a new line)
      handleSend();
    }
    // For native (iOS/Android), returnKeyType="send" with onSubmitEditing is usually enough.
    // We can leave onSubmitEditing in the TextInput props as a fallback/for native.
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust as needed for keyboard
      style={styles.container}
    >
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          onKeyPress={handleKeyPress} // <--- NEW: Handle key press for web Enter
          placeholder="Type your message..."
          placeholderTextColor={Colors.light.text.muted}
          multiline
          maxHeight={100}
          returnKeyType="send" // Still useful for showing 'Send' button on mobile keyboards
          onSubmitEditing={handleSend} // Keep for mobile behavior if onKeyPress doesn't fire
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Send size={24} color={Colors.light.cardBackground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: Colors.light.background, // Match tab bar background
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabIconDefault, // Subtle border
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to the bottom, especially multiline input
    backgroundColor: Colors.light.cardBackground, // White background for input
    borderRadius: 25,
    paddingHorizontal: 15,
    minHeight: 50, // Minimum height for input area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text.primary,
    paddingTop: Platform.OS === 'ios' ? 14 : 10, // Adjust vertical alignment for multiline
    paddingBottom: Platform.OS === 'ios' ? 14 : 10, // Adjust vertical alignment for multiline
    // fontFamily: 'Inter Tight', // Apply once fonts are loaded
  },
  sendButton: {
    backgroundColor: Colors.light.tint, // Sprout Green for send button
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 5, // Align with text input baseline
  },
});
