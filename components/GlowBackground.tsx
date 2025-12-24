// components/GlowBackground.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence 
} from 'react-native-reanimated';
import { Canvas, RadialGradient, vec2, Rect, Blur } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

export const GlowBackground = ({ intensity }: { intensity: number }) => {
  const pulse = useSharedValue(0.8);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 4000 }),
        withTiming(0.8, { duration: 4000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: withTiming(intensity, { duration: 1000 }),
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.glowContainer, animatedGlow]}>
        <Canvas style={{ flex: 1 }}>
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={vec2(width / 2, height / 3)}
              r={width * 0.8}
              colors={['rgba(100, 150, 255, 0.3)', 'rgba(0, 0, 0, 0)']}
            />
            <Blur blur={60} />
          </Rect>
        </Canvas>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
});