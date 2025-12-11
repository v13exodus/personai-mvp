// app/(tabs)/memory.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function MemoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memory Screen</Text>
      <Text style={styles.subtitle}>Your accumulated insights and learned patterns will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundForestSecondary, // Using a dark background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.textPrimary, // Light text for dark background
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary, // Muted light text
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});