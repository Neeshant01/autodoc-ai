// Pipeline progress tracker with step-by-step visualization
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, PIPELINE_STEPS } from '../constants/theme';
import { PipelineState, StepStatus } from '../types';

const { width } = Dimensions.get('window');

interface Props {
  pipeline: PipelineState;
}

export default function PipelineProgress({ pipeline }: Props) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pipeline.overallProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [pipeline.overallProgress]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getStepIcon = (status: StepStatus): string => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'processing': return 'sync';
      case 'error': return 'alert-circle';
      default: return 'ellipse-outline';
    }
  };

  const getStepColor = (status: StepStatus, color: string): string => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'processing': return color;
      case 'error': return COLORS.error;
      default: return COLORS.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      {/* Overall progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progressWidth },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(pipeline.overallProgress)}%
        </Text>
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {PIPELINE_STEPS.map((step, index) => {
          const pipelineStep = pipeline.steps[index];
          const isActive = pipelineStep?.status === 'processing';
          const color = getStepColor(pipelineStep?.status || 'pending', step.color);

          return (
            <View key={step.id} style={styles.stepRow}>
              {/* Connector line */}
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor:
                        pipelineStep?.status === 'completed' || pipelineStep?.status === 'processing'
                          ? color
                          : COLORS.textMuted + '30',
                    },
                  ]}
                />
              )}

              {/* Step indicator */}
              <Animated.View
                style={[
                  styles.stepIcon,
                  {
                    borderColor: color,
                    backgroundColor: isActive ? color + '20' : 'transparent',
                    transform: [{ scale: isActive ? pulseAnim : 1 }],
                  },
                ]}
              >
                <Ionicons
                  name={getStepIcon(pipelineStep?.status || 'pending') as any}
                  size={20}
                  color={color}
                />
              </Animated.View>

              {/* Step info */}
              <View style={styles.stepInfo}>
                <View style={styles.stepHeader}>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color:
                          pipelineStep?.status === 'completed' || isActive
                            ? COLORS.textPrimary
                            : COLORS.textMuted,
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {pipelineStep?.status === 'processing' && (
                    <Text style={[styles.stepProgress, { color }]}>
                      {pipelineStep.progress}%
                    </Text>
                  )}
                  {pipelineStep?.status === 'completed' && (
                    <Text style={styles.stepDone}>Done ✓</Text>
                  )}
                </View>
                {isActive && pipelineStep?.message && (
                  <Text style={[styles.stepMessage, { color: color + 'CC' }]}>
                    {pipelineStep.message}
                  </Text>
                )}

                {/* Step mini progress bar */}
                {isActive && (
                  <View style={styles.miniProgressBg}>
                    <View
                      style={[
                        styles.miniProgressFill,
                        {
                          width: `${pipelineStep?.progress || 0}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  stepsContainer: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  connector: {
    position: 'absolute',
    left: 19,
    top: -8,
    width: 2,
    height: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stepInfo: {
    flex: 1,
    paddingTop: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepProgress: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepDone: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  stepMessage: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '400',
  },
  miniProgressBg: {
    height: 3,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.full,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});
