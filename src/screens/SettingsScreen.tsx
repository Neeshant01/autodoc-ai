// Settings Screen — Gemini API Key Configuration
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import ChipSelector from '../components/ChipSelector';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
  testGeminiConnection,
} from '../services/gemini';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSettings = async () => {
    const key = await getGeminiApiKey();
    const mdl = await getGeminiModel();
    setApiKey(key);
    setModel(mdl);
  };

  const handleSave = async () => {
    await setGeminiApiKey(apiKey.trim());
    await setGeminiModel(model);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      Alert.alert('No API Key', 'Please enter your Gemini API key first.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await testGeminiConnection(apiKey.trim());
    setTestResult(result);
    setTesting(false);
  };

  const handleGetKey = () => {
    Linking.openURL('https://ai.google.dev/gemini-api/docs/api-key');
  };

  const maskedKey = apiKey
    ? `${apiKey.substring(0, 6)}${'•'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.substring(apiKey.length - 4)}`
    : '';

  const MODELS = [
    { id: 'gemini-2.0-flash', label: '2.0 Flash ⚡' },
    { id: 'gemini-2.0-flash-lite', label: '2.0 Lite 🪶' },
    { id: 'gemini-2.5-pro-preview-05-06', label: '2.5 Pro 🧠' },
    { id: 'gemini-2.5-flash-preview-05-20', label: '2.5 Flash 💫' },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Configure your AI engine</Text>
        </View>

        {/* Gemini AI Card */}
        <GlassCard variant="elevated" style={styles.geminiCard}>
          <View style={styles.geminiHeader}>
            <LinearGradient
              colors={['#4285F4', '#34A853'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.geminiIcon}
            >
              <Ionicons name="sparkles" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.geminiTitleGroup}>
              <Text style={styles.geminiTitle}>Google Gemini AI</Text>
              <Text style={styles.geminiSubtitle}>
                {apiKey ? '✅ API Key configured' : '⚠️ API Key not set'}
              </Text>
            </View>
          </View>

          {/* API Key Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>API Key</Text>
            <View style={styles.keyInputRow}>
              <TextInput
                style={styles.keyInput}
                placeholder="Enter your Gemini API key..."
                placeholderTextColor={COLORS.textMuted}
                value={showKey ? apiKey : maskedKey}
                onChangeText={setApiKey}
                secureTextEntry={false}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowKey(!showKey)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showKey ? 'eye-off' : 'eye'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleGetKey} style={styles.getKeyLink}>
              <Ionicons name="open-outline" size={14} color={COLORS.accent} />
              <Text style={styles.getKeyText}>
                Get a free Gemini API key
              </Text>
            </TouchableOpacity>
          </View>

          {/* Model Selection */}
          <ChipSelector
            label="🤖 Gemini Model"
            options={MODELS}
            selected={model}
            onSelect={setModel}
            style={{ marginTop: SPACING.md }}
          />

          {/* Test & Save Buttons */}
          <View style={styles.actions}>
            <GradientButton
              title={testing ? 'Testing...' : '🔗  Test Connection'}
              onPress={handleTest}
              variant="outline"
              size="medium"
              disabled={!apiKey.trim() || testing}
            />

            <GradientButton
              title={saved ? '✅ Saved!' : '💾  Save Settings'}
              onPress={handleSave}
              size="medium"
              disabled={!apiKey.trim()}
              style={{ marginTop: SPACING.sm }}
            />
          </View>

          {/* Test Result */}
          {testing && (
            <View style={styles.testResult}>
              <ActivityIndicator color={COLORS.accent} size="small" />
              <Text style={styles.testingText}>Connecting to Gemini...</Text>
            </View>
          )}

          {testResult && (
            <View
              style={[
                styles.testResult,
                {
                  backgroundColor: testResult.success
                    ? 'rgba(0, 214, 143, 0.1)'
                    : 'rgba(255, 71, 87, 0.1)',
                  borderColor: testResult.success
                    ? 'rgba(0, 214, 143, 0.3)'
                    : 'rgba(255, 71, 87, 0.3)',
                },
              ]}
            >
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={testResult.success ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.testResultText,
                  { color: testResult.success ? COLORS.success : COLORS.error },
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Info Card */}
        <GlassCard variant="accent" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={COLORS.accent} />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.infoText}>
            When a Gemini API key is configured, AutoDoc AI uses Google's Gemini to:
          </Text>
          <View style={styles.infoList}>
            {[
              '✍️ Write engaging documentary scripts',
              '🎨 Create optimized image generation prompts',
              '📝 Generate YouTube-ready titles, descriptions & tags',
            ].map((item, i) => (
              <Text key={i} style={styles.infoItem}>{item}</Text>
            ))}
          </View>
          <Text style={[styles.infoText, { marginTop: SPACING.sm }]}>
            Without an API key, the app uses pre-built templates.
          </Text>
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>AutoDoc AI v2.0</Text>
          <Text style={styles.aboutText}>
            Powered by Google Gemini • Built with React Native
          </Text>
          <Text style={styles.aboutText}>
            AI Documentary Video Generator
          </Text>
        </GlassCard>
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
  geminiCard: {
    marginBottom: SPACING.md,
  },
  geminiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  geminiIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geminiTitleGroup: {
    flex: 1,
  },
  geminiTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  geminiSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  keyInput: {
    flex: 1,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  eyeBtn: {
    padding: SPACING.md,
  },
  getKeyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  getKeyText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
    backgroundColor: 'rgba(78, 205, 196, 0.05)',
  },
  testingText: {
    color: COLORS.accent,
    fontSize: 14,
  },
  testResultText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  infoList: {
    marginTop: SPACING.sm,
    gap: 6,
  },
  infoItem: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: 4,
  },
  aboutCard: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  aboutTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  aboutText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 2,
  },
});
