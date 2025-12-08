/**
 * PersonAI Nature-Centric Palette
 * Based on UX/UI Specification
 */

const tintColorLight = '#6B8E23'; // Olive Drab / Soft Green
const tintColorDark = '#8FBC8F'; // Dark Sea Green

export const Colors = {
  light: {
    text: '#2F4F4F', // Dark Slate Gray (Softer than black)
    background: '#F5F5DC', // Beige / Warm Sand
    tint: tintColorLight,
    icon: '#6B8E23',
    tabIconDefault: '#A9A9A9',
    tabIconSelected: tintColorLight,
    cardBackground: '#FFFFFF', // Clean White cards
    softGreen: '#E0F2E9', // Bubble background
    earthBrown: '#8B4513', // Accents
  },
  dark: {
    text: '#ECEDEE',
    background: '#1a1a1a', // Dark Gray (Not pure black)
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    cardBackground: '#2C2C2C',
    softGreen: '#2F4F4F',
    earthBrown: '#A0522D',
  },
};
