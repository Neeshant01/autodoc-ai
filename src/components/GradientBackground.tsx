// Gradient background component
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'dark';
}

export default function GradientBackground({ children, variant = 'default' }: Props) {
  const gradients: Record<string, string[]> = {
    default: [COLORS.bgDark, '#0D1225', '#111730'],
    accent: [COLORS.bgDark, '#0F1528', '#141E3C'],
    dark: ['#060810', COLORS.bgDark, '#0D1225'],
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients[variant] as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative orbs */}
        <View style={[styles.orb, styles.orbPurple]} />
        <View style={[styles.orb, styles.orbTeal]} />
        <View style={[styles.orb, styles.orbPink]} />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  orbPurple: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: COLORS.primary,
    top: -width * 0.2,
    right: -width * 0.3,
  },
  orbTeal: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: COLORS.accent,
    bottom: height * 0.15,
    left: -width * 0.2,
  },
  orbPink: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: '#EC4899',
    top: height * 0.4,
    right: -width * 0.15,
  },
});
