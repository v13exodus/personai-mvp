// app/(tabs)/programs.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function ProgramsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programs Screen</Text>
      <Text style={styles.subtitle}>Explore structured programs for deeper growth.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundForestSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});