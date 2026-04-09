// Result Screen - Video preview, download, share
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { VideoProject } from '../types';

const { width } = Dimensions.get('window');

interface Props {
  project: VideoProject;
  onNewVideo: () => void;
}

export default function ResultScreen({ project, onNewVideo }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti burst
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const result = project.result;
  if (!result) return null;

  const handleDownload = () => {
    Alert.alert(
      'Download Video',
      'Your video is ready for download! In a production app, this would save the video to your device.',
      [{ text: 'OK' }]
    );
  };

  const handleShareYouTube = () => {
    Alert.alert(
      'Share to YouTube',
      `Title: ${result.title}\n\nDescription and tags have been auto-generated. In a production app, this would open the YouTube upload flow.`,
      [{ text: 'OK' }]
    );
  };

  const handleCopyMetadata = () => {
    Alert.alert('Copied!', 'Title, description, and tags copied to clipboard.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        {/* Success Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[COLORS.success, '#00B87A'] as any}
            style={styles.successBadge}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.successText}>Video Generated!</Text>
          </LinearGradient>
        </View>

        {/* Video Preview */}
        <GlassCard variant="elevated" style={styles.previewCard}>
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: result.thumbnailUrl }}
              style={styles.thumbnail}
            />
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={36} color="#fff" />
              </View>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {Math.floor(result.duration / 60)}:{String(result.duration % 60).padStart(2, '0')}
              </Text>
            </View>
          </View>

          <Text style={styles.videoTitle}>{result.title}</Text>

          {/* Video Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Ionicons name="videocam" size={14} color={COLORS.accent} />
              <Text style={styles.infoText}>{result.resolution}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="document" size={14} color={COLORS.accent} />
              <Text style={styles.infoText}>{result.fileSize}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="time" size={14} color={COLORS.accent} />
              <Text style={styles.infoText}>
                {result.duration >= 60
                  ? `${Math.floor(result.duration / 60)}m ${result.duration % 60}s`
                  : `${result.duration}s`}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <GradientButton
            title="⬇  Download Video"
            onPress={handleDownload}
            size="large"
            variant="primary"
          />

          <GradientButton
            title="📤  Share to YouTube"
            onPress={handleShareYouTube}
            size="medium"
            variant="secondary"
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Auto-Generated Metadata */}
        <GlassCard variant="accent" style={styles.metadataCard}>
          <View style={styles.metadataHeader}>
            <Text style={styles.metadataTitle}>📝 Auto-Generated Metadata</Text>
            <TouchableOpacity onPress={handleCopyMetadata} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={18} color={COLORS.accent} />
              <Text style={styles.copyText}>Copy All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metadataSection}>
            <Text style={styles.metadataLabel}>Title</Text>
            <Text style={styles.metadataValue}>{result.title}</Text>
          </View>

          <View style={styles.metadataSection}>
            <Text style={styles.metadataLabel}>Description</Text>
            <Text style={styles.metadataValue} numberOfLines={4}>
              {result.description}
            </Text>
          </View>

          <View style={styles.metadataSection}>
            <Text style={styles.metadataLabel}>Tags</Text>
            <View style={styles.tagsRow}>
              {result.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </GlassCard>

        {/* Script Preview */}
        <GlassCard style={styles.scriptCard}>
          <Text style={styles.scriptTitle}>📜 Script Scenes</Text>
          {result.script.map((scene) => (
            <View key={scene.id} style={styles.sceneItem}>
              <View style={styles.sceneHeader}>
                <View style={styles.sceneBadge}>
                  <Text style={styles.sceneNumber}>Scene {scene.id}</Text>
                </View>
                <Text style={styles.sceneDuration}>{scene.duration}s</Text>
              </View>
              <Text style={styles.sceneNarration}>{scene.narration}</Text>
              <Text style={styles.sceneVisual}>
                🎬 {scene.visualDescription}
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Generated Images */}
        <GlassCard style={styles.imagesCard}>
          <Text style={styles.imagesTitle}>🖼 Generated Images</Text>
          <View style={styles.imagesGrid}>
            {result.images.map((img) => (
              <View key={img.id} style={styles.imageItem}>
                <Image source={{ uri: img.url }} style={styles.generatedImage} />
                <Text style={styles.imagePrompt} numberOfLines={2}>
                  {img.prompt}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* New Video Button */}
        <View style={styles.newVideoSection}>
          <GradientButton
            title="🎬  Create New Video"
            onPress={onNewVideo}
            variant="outline"
            size="medium"
          />
        </View>
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
    paddingTop: SPACING.xxl + 10,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
  },
  successText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  previewCard: {
    marginBottom: SPACING.lg,
  },
  videoContainer: {
    position: 'relative',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  thumbnail: {
    width: '100%',
    height: (width - SPACING.lg * 2 - SPACING.lg * 2) * 0.5625, // 16:9
    backgroundColor: COLORS.bgInput,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(108, 99, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgInput,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  metadataCard: {
    marginBottom: SPACING.md,
  },
  metadataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metadataTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  metadataSection: {
    marginBottom: SPACING.md,
  },
  metadataLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metadataValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.bgInput,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  tagText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  scriptCard: {
    marginBottom: SPACING.md,
  },
  scriptTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  sceneItem: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 146, 176, 0.1)',
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sceneBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  sceneNumber: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  sceneDuration: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  sceneNarration: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 6,
  },
  sceneVisual: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  imagesCard: {
    marginBottom: SPACING.lg,
  },
  imagesTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  imagesGrid: {
    gap: SPACING.md,
  },
  imageItem: {
    marginBottom: SPACING.sm,
  },
  generatedImage: {
    width: '100%',
    height: (width - SPACING.lg * 4) * 0.5625,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgInput,
  },
  imagePrompt: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  newVideoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
});
