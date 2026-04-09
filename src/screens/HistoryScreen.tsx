// History Screen - Past video generations
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Animated,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import { VideoProject } from '../types';
import { getHistory, deleteProject, clearHistory } from '../services/storage';

interface Props {
  onViewProject: (project: VideoProject) => void;
  refreshTrigger: number;
}

export default function HistoryScreen({ onViewProject, refreshTrigger }: Props) {
  const [history, setHistory] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getHistory();
    setHistory(data);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProject(id);
            loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'This will delete all your past video generations. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            loadHistory();
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your generated videos</Text>
        </View>

        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="film-outline" size={64} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Videos Yet</Text>
            <Text style={styles.emptyText}>
              Your generated videos will appear here. Go to the Home tab to create your first documentary!
            </Text>
          </View>
        )}

        {/* History List */}
        {history.map((project, index) => (
          <Animated.View
            key={project.id}
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20 * (index + 1), 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => onViewProject(project)}
              activeOpacity={0.8}
            >
              <GlassCard style={styles.historyCard}>
                <View style={styles.cardContent}>
                  {/* Thumbnail */}
                  <Image
                    source={{
                      uri:
                        project.result?.thumbnailUrl ||
                        `https://picsum.photos/seed/${project.id}/400/225`,
                    }}
                    style={styles.cardThumb}
                  />

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTopic} numberOfLines={2}>
                      {project.topic}
                    </Text>

                    <View style={styles.cardMeta}>
                      <View style={[
                        styles.statusBadgeBase,
                        {
                          backgroundColor:
                            project.status === 'completed'
                              ? 'rgba(0, 214, 143, 0.1)'
                              : project.status === 'error'
                              ? 'rgba(255, 71, 87, 0.1)'
                              : 'rgba(255, 170, 0, 0.1)',
                        },
                      ]}>
                        <Ionicons
                          name={
                            project.status === 'completed'
                              ? 'checkmark-circle'
                              : project.status === 'error'
                              ? 'alert-circle'
                              : 'ellipse'
                          }
                          size={12}
                          color={
                            project.status === 'completed'
                              ? COLORS.success
                              : project.status === 'error'
                              ? COLORS.error
                              : COLORS.warning
                          }
                        />
                        <Text
                          style={[
                            styles.statusTextBase,
                            {
                              color:
                                project.status === 'completed'
                                  ? COLORS.success
                                  : project.status === 'error'
                                  ? COLORS.error
                                  : COLORS.warning,
                            },
                          ]}
                        >
                          {project.status}
                        </Text>
                      </View>
                      <Text style={styles.cardDate}>
                        {formatDate(project.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.cardTags}>
                      <Text style={styles.cardTag}>
                        {project.language === 'english' ? '🇺🇸' : '🇮🇳'} {project.language}
                      </Text>
                      <Text style={styles.cardTag}>⏱ {project.videoLength}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <TouchableOpacity
                    onPress={() => handleDelete(project.id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
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
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginBottom: SPACING.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  clearText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl * 2,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.xl,
  },
  historyCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  cardContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cardThumb: {
    width: 90,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgInput,
  },
  cardInfo: {
    flex: 1,
  },
  cardTopic: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  statusBadgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  statusTextBase: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardDate: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  cardTags: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cardTag: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
});
