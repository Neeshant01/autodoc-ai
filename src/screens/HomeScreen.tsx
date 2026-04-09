// Home Screen - Topic input, settings, generate button
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, LANGUAGES, VIDEO_LENGTHS, VOICE_OPTIONS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import ChipSelector from '../components/ChipSelector';
import { GenerationConfig } from '../types';

const { width } = Dimensions.get('window');

interface Props {
  onGenerate: (config: GenerationConfig) => void;
}

export default function HomeScreen({ onGenerate }: Props) {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('english');
  const [videoLength, setVideoLength] = useState('1m');
  const [voiceType, setVoiceType] = useState('male_deep');
  const [youtubeLinks, setYoutubeLinks] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    const links = youtubeLinks
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    onGenerate({
      topic: topic.trim(),
      language,
      videoLength,
      voiceType,
      youtubeLinks: links,
    });
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Title */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View style={[styles.logoContainer, { shadowOpacity: glowOpacity as any }]}>
            <LinearGradient
              colors={[COLORS.primaryStart, COLORS.primaryEnd] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="videocam" size={32} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.title}>AutoDoc AI</Text>
          <Text style={styles.subtitle}>
            Generate stunning documentary videos with AI
          </Text>
        </Animated.View>

        {/* Topic Input */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <GlassCard variant="elevated" style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.accent} />
              <Text style={styles.inputLabel}>What's your video about?</Text>
            </View>
            <TextInput
              style={styles.topicInput}
              placeholder="e.g., The Mystery of Black Holes"
              placeholderTextColor={COLORS.textMuted}
              value={topic}
              onChangeText={setTopic}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Quick suggestions */}
            <View style={styles.suggestions}>
              {['Space Exploration', 'Ancient Egypt', 'AI Revolution', 'Ocean Depths'].map(
                (suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => setTopic(suggestion)}
                  >
                    <Ionicons name="flash" size={12} color={COLORS.accent} />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Settings */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <GlassCard style={styles.settingsCard}>
            <ChipSelector
              label="🌐 Language"
              options={LANGUAGES}
              selected={language}
              onSelect={setLanguage}
            />

            <ChipSelector
              label="⏱ Video Length"
              options={VIDEO_LENGTHS}
              selected={videoLength}
              onSelect={setVideoLength}
            />

            <ChipSelector
              label="🎙 Voice Type"
              options={VOICE_OPTIONS}
              selected={voiceType}
              onSelect={setVoiceType}
            />
          </GlassCard>
        </Animated.View>

        {/* Advanced Options */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <TouchableOpacity
            onPress={() => setShowAdvanced(!showAdvanced)}
            style={styles.advancedToggle}
          >
            <Text style={styles.advancedText}>Advanced Options</Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {showAdvanced && (
            <GlassCard style={styles.advancedCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                <Text style={styles.inputLabel}>
                  Reference YouTube Links (Optional)
                </Text>
              </View>
              <TextInput
                style={[styles.topicInput, { minHeight: 80 }]}
                placeholder="Paste YouTube URLs (one per line)..."
                placeholderTextColor={COLORS.textMuted}
                value={youtubeLinks}
                onChangeText={setYoutubeLinks}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.helpText}>
                Add 3-5 reference videos to influence the style and content
              </Text>
            </GlassCard>
          )}
        </Animated.View>

        {/* Generate Button */}
        <View style={styles.generateSection}>
          <GradientButton
            title="✨  Generate Video"
            onPress={handleGenerate}
            disabled={!topic.trim()}
            size="large"
          />
          <Text style={styles.disclaimer}>
            AI-generated content • ~2-5 minutes processing
          </Text>
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          {[
            { icon: 'sparkles', label: 'AI Script Writing', color: COLORS.stepScript },
            { icon: 'image', label: 'Image Generation', color: COLORS.stepImage },
            { icon: 'mic', label: 'AI Voiceover', color: COLORS.stepVoice },
            { icon: 'film', label: '1080p Export', color: COLORS.stepExport },
          ].map((feature) => (
            <View key={feature.label} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={20} color={feature.color} />
              </View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  logoContainer: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    elevation: 15,
    marginBottom: SPACING.md,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputCard: {
    marginBottom: SPACING.md,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  topicInput: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
    lineHeight: 24,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.md,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.15)',
  },
  suggestionText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  settingsCard: {
    marginBottom: SPACING.md,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  advancedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  advancedCard: {
    marginBottom: SPACING.md,
  },
  helpText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  generateSection: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.md,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.sm,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
