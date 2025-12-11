// components/ChatInput.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Send } from 'lucide-react-native'; // Using lucide-react-native for a simple send icon
import { Colors } from '@/constants/Colors'; // Your custom colors

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean; // Added disabled prop as seen in index.tsx
};

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) { // Check disabled state before sending
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
          placeholderTextColor={Colors.light.textSecondary} // Corrected: Using textSecondary for muted placeholder
          multiline
          maxHeight={100}
          returnKeyType="send" // Still useful for showing 'Send' button on mobile keyboards
          onSubmitEditing={handleSend} // Keep for mobile behavior if onKeyPress doesn't fire
          editable={!disabled} // Disable editing when sending
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={disabled}>
          <Send size={24} color={Colors.light.buttonText} /> {/* Corrected: Using buttonText (white) for icon */}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: Colors.light.backgroundForest, // From app.json: Dark forest background for input area
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle, // From app.json: Subtle border color
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to the bottom, especially multiline input
    backgroundColor: Colors.light.chatInputBackground, // From app.json: Specific input background
    borderRadius: 20, // From app.json: cornerRadius.inputFields
    paddingHorizontal: 15,
    minHeight: 50, // Minimum height for input area
    shadowColor: Colors.dark.textPrimary, // Using a dark primary for shadow color (can adjust)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.textPrimary, // Corrected: Using textPrimary
    paddingTop: Platform.OS === 'ios' ? 14 : 10, // Adjust vertical alignment for multiline
    paddingBottom: Platform.OS === 'ios' ? 14 : 10, // Adjust vertical alignment for multiline
    // fontFamily: 'Quicksand_400Regular', // Apply once fonts are loaded
  },
  sendButton: {
    backgroundColor: Colors.light.brandPrimaryGreen, // From app.json: A prominent green for send button
    borderRadius: 24, // From app.json: cornerRadius.buttons
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 5, // Align with text input baseline
  },
});