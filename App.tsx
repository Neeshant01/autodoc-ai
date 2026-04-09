// AutoDoc AI - Main Application
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from './src/constants/theme';
import GradientBackground from './src/components/GradientBackground';
import HomeScreen from './src/screens/HomeScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { generateVideo } from './src/services/api';
import { saveProject } from './src/services/storage';
import { GenerationConfig, VideoProject, PipelineState } from './src/types';

const { width } = Dimensions.get('window');

type Screen = 'home' | 'processing' | 'result' | 'history';
type Tab = 'home' | 'history';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentConfig, setCurrentConfig] = useState<GenerationConfig | null>(null);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [pipeline, setPipeline] = useState<PipelineState>({
    currentStep: 0,
    overallProgress: 0,
    steps: [],
  });
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Tab bar animation
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const handleTabPress = (tab: Tab) => {
    if (currentScreen === 'processing') return; // Don't allow tab switch during processing

    setActiveTab(tab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'home' ? 0 : 1,
      friction: 8,
      useNativeDriver: true,
    }).start();

    if (tab === 'home') {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('history');
      setHistoryRefresh((p) => p + 1);
    }
  };

  const handleGenerate = useCallback(async (config: GenerationConfig) => {
    setCurrentConfig(config);
    setCurrentScreen('processing');

    try {
      const project = await generateVideo(config, (state) => {
        setPipeline({ ...state });
      });

      setCurrentProject(project);
      await saveProject(project);
      setHistoryRefresh((p) => p + 1);

      // Small delay to show 100% before transitioning
      setTimeout(() => {
        setCurrentScreen('result');
      }, 1500);
    } catch (error) {
      console.error('Generation failed:', error);
      setCurrentScreen('home');
    }
  }, []);

  const handleNewVideo = () => {
    setCurrentScreen('home');
    setActiveTab('home');
    setCurrentConfig(null);
    setCurrentProject(null);
    Animated.spring(tabIndicatorAnim, {
      toValue: 0,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleViewProject = (project: VideoProject) => {
    setCurrentProject(project);
    setCurrentScreen('result');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onGenerate={handleGenerate} />;
      case 'processing':
        return currentConfig ? (
          <ProcessingScreen config={currentConfig} pipeline={pipeline} />
        ) : null;
      case 'result':
        return currentProject ? (
          <ResultScreen project={currentProject} onNewVideo={handleNewVideo} />
        ) : null;
      case 'history':
        return (
          <HistoryScreen
            onViewProject={handleViewProject}
            refreshTrigger={historyRefresh}
          />
        );
      default:
        return null;
    }
  };

  const isProcessing = currentScreen === 'processing';
  const showTabs = currentScreen !== 'processing' && currentScreen !== 'result';

  const tabTranslateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - SPACING.lg],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
      <GradientBackground>
        {renderScreen()}

        {/* Bottom Tab Bar */}
        {showTabs && (
          <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
              {/* Animated indicator */}
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    transform: [{ translateX: tabTranslateX }],
                    width: (width - SPACING.lg * 2 - SPACING.md * 2) / 2,
                  },
                ]}
              />

              {/* Home Tab */}
              <TouchableOpacity
                style={styles.tab}
                onPress={() => handleTabPress('home')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeTab === 'home' ? 'home' : 'home-outline'}
                  size={24}
                  color={activeTab === 'home' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'home' && styles.tabLabelActive,
                  ]}
                >
                  Create
                </Text>
              </TouchableOpacity>

              {/* History Tab */}
              <TouchableOpacity
                style={styles.tab}
                onPress={() => handleTabPress('history')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeTab === 'history' ? 'time' : 'time-outline'}
                  size={24}
                  color={activeTab === 'history' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'history' && styles.tabLabelActive,
                  ]}
                >
                  History
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Back button for result screen */}
        {currentScreen === 'result' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleNewVideo}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </View>
          </TouchableOpacity>
        )}
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: SPACING.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 24, 41, 0.95)',
    borderRadius: RADIUS.xl,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  tabIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    height: '100%',
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderRadius: RADIUS.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: SPACING.lg,
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 33, 55, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
