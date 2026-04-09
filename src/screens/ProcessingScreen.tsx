// Processing Screen - Shows live pipeline progress
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, PIPELINE_STEPS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import PipelineProgress from '../components/PipelineProgress';
import { PipelineState, GenerationConfig } from '../types';

const { width } = Dimensions.get('window');

interface Props {
  config: GenerationConfig;
  pipeline: PipelineState;
}

export default function ProcessingScreen({ config, pipeline }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Spinning animation for the processing icon
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Bouncing dots animation
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dotAnim1, 0);
    animateDot(dotAnim2, 200);
    animateDot(dotAnim3, 400);
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentStep = PIPELINE_STEPS[pipeline.currentStep] || PIPELINE_STEPS[0];
  const currentStepData = pipeline.steps[pipeline.currentStep];
  const isComplete = pipeline.overallProgress >= 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          {isComplete ? (
            <View style={styles.completeIcon}>
              <LinearGradient
                colors={[COLORS.success, '#00B87A'] as any}
                style={styles.completeGradient}
              >
                <Ionicons name="checkmark" size={40} color="#fff" />
              </LinearGradient>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.spinnerContainer,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <LinearGradient
                colors={[currentStep.color, currentStep.color + '80'] as any}
                style={styles.spinnerGradient}
              >
                <Ionicons name={currentStep.icon as any} size={28} color="#fff" />
              </LinearGradient>
            </Animated.View>
          )}

          <Text style={styles.title}>
            {isComplete ? 'Video Ready! 🎬' : 'Creating Your Video'}
          </Text>

          {!isComplete && (
            <View style={styles.dotsContainer}>
              <Text style={styles.currentAction}>
                {currentStepData?.message || 'Initializing'}
              </Text>
              <View style={styles.dots}>
                {[dotAnim1, dotAnim2, dotAnim3].map((dot, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: currentStep.color,
                        transform: [
                          {
                            translateY: dot.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -8],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Topic badge */}
        <GlassCard style={styles.topicBadge}>
          <View style={styles.topicRow}>
            <Ionicons name="document-text" size={18} color={COLORS.accent} />
            <Text style={styles.topicLabel}>Topic:</Text>
            <Text style={styles.topicText} numberOfLines={2}>
              {config.topic}
            </Text>
          </View>
          <View style={styles.configRow}>
            <View style={styles.configBadge}>
              <Text style={styles.configText}>
                {config.language === 'english' ? '🇺🇸' : '🇮🇳'} {config.language}
              </Text>
            </View>
            <View style={styles.configBadge}>
              <Text style={styles.configText}>⏱ {config.videoLength}</Text>
            </View>
            <View style={styles.configBadge}>
              <Text style={styles.configText}>🎙 {config.voiceType.replace('_', ' ')}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Pipeline Progress */}
        <GlassCard variant="elevated">
          <View style={styles.pipelineHeader}>
            <Text style={styles.pipelineTitle}>Generation Pipeline</Text>
            <Text style={[styles.pipelineStatus, { color: isComplete ? COLORS.success : currentStep.color }]}>
              {isComplete ? 'Complete' : `Step ${pipeline.currentStep + 1}/${PIPELINE_STEPS.length}`}
            </Text>
          </View>
          <PipelineProgress pipeline={pipeline} />
        </GlassCard>

        {/* Preview section - show generated images when available */}
        {pipeline.currentStep >= 2 && (
          <GlassCard style={styles.previewCard}>
            <Text style={styles.previewTitle}>🖼 Generated Scenes Preview</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewScroll}
            >
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.previewItem}>
                  <Image
                    source={{ uri: `https://picsum.photos/seed/scene${i}doc/400/225` }}
                    style={styles.previewImage}
                  />
                  <Text style={styles.previewLabel}>Scene {i}</Text>
                </View>
              ))}
            </ScrollView>
          </GlassCard>
        )}

        {/* Estimated time */}
        {!isComplete && (
          <View style={styles.estimateContainer}>
            <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.estimateText}>
              Estimated time remaining: ~{Math.max(1, Math.round((100 - pipeline.overallProgress) / 20))} min
            </Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  spinnerContainer: {
    marginBottom: SPACING.md,
  },
  spinnerGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeIcon: {
    marginBottom: SPACING.md,
  },
  completeGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  dotsContainer: {
    alignItems: 'center',
  },
  currentAction: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  topicBadge: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  topicLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  topicText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  configRow: {
    flexDirection: 'row',
    gap: 8,
  },
  configBadge: {
    backgroundColor: COLORS.bgInput,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  configText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pipelineTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  pipelineStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewCard: {
    marginTop: SPACING.md,
  },
  previewTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  previewScroll: {
    gap: SPACING.md,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewImage: {
    width: width * 0.55,
    height: width * 0.31,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgInput,
  },
  previewLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.lg,
  },
  estimateText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
