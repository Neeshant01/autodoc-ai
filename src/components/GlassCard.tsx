// Glass Card component with frosted glass effect
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'accent';
}

export default function GlassCard({ children, style, variant = 'default' }: Props) {
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: COLORS.glassBg,
      borderColor: COLORS.glassBorder,
    },
    elevated: {
      backgroundColor: 'rgba(28, 33, 55, 0.8)',
      borderColor: 'rgba(108, 99, 255, 0.3)',
      ...SHADOWS.card,
    },
    accent: {
      backgroundColor: 'rgba(78, 205, 196, 0.08)',
      borderColor: 'rgba(78, 205, 196, 0.2)',
    },
  };

  return (
    <View style={[styles.card, variantStyles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
});
