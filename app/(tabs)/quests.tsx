// app/(tabs)/quests.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function QuestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quests Screen</Text>
      <Text style={styles.subtitle}>Embark on tiny, actionable quests for real-world transformation.</Text>
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