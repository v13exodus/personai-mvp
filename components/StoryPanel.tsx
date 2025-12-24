// components/StoryPanel.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, useAnimatedStyle, withRepeat, 
  withTiming, withSequence, interpolateColor 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function StoryPanel({ text, type, index }: { text: string, type: string, index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 8000 }),
      -1, true
    );
  }, []);

  const animatedBg = useAnimatedStyle(() => {
    return {
      opacity: 0.6 + (progress.value * 0.4),
      transform: [{ scale: 1 + (progress.value * 0.05) }]
    };
  });

  // Cosmic color shifts based on index (even/odd)
  const colors = index % 2 === 0 
    ? ['#1a0b2e', '#4a148c', '#000000'] // Deep Purple/Void
    : ['#001a1a', '#004d40', '#000000']; // Deep Teal/Cosmic

  return (
    <View style={styles.panelFrame}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedBg]}>
        <LinearGradient colors={colors} style={styles.gradient} />
      </Animated.View>
      
      <View style={styles.content}>
        <Text style={styles.typeLabel}>{type.toUpperCase()}</Text>
        <Text style={styles.storyText}>"{text}"</Text>
      </View>

      {/* Comic Border Overlay */}
      <View style={styles.borderOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  panelFrame: {
    width: width - 40,
    height: 220,
    backgroundColor: '#000',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gradient: { flex: 1 },
  content: {
    flex: 1,
    padding: 25,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  typeLabel: {
    fontSize: 10,
    letterSpacing: 4,
    color: '#A5D6A7', // Soft green for "growth"
    marginBottom: 10,
    fontWeight: 'bold',
  },
  storyText: {
    fontSize: 18,
    color: '#FFF',
    fontStyle: 'italic',
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#000',
    opacity: 0.5,
  }
});