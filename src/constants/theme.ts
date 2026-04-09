// AutoDoc AI Theme Constants
export const COLORS = {
  // Primary gradient
  primaryStart: '#6C63FF',
  primaryEnd: '#4ECDC4',
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  accent: '#4ECDC4',
  accentLight: '#7EDDD6',

  // Backgrounds
  bgDark: '#0A0E1A',
  bgCard: '#141829',
  bgCardLight: '#1C2137',
  bgInput: '#1A1F35',
  bgOverlay: 'rgba(10, 14, 26, 0.85)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8B92B0',
  textMuted: '#555C77',
  textAccent: '#4ECDC4',

  // Status
  success: '#00D68F',
  warning: '#FFAA00',
  error: '#FF4757',
  info: '#3B82F6',

  // Steps
  stepScript: '#6C63FF',
  stepPrompt: '#8B5CF6',
  stepImage: '#EC4899',
  stepAnimation: '#F97316',
  stepVoice: '#06B6D4',
  stepEdit: '#10B981',
  stepExport: '#4ECDC4',

  // Glass
  glassBg: 'rgba(28, 33, 55, 0.6)',
  glassBorder: 'rgba(108, 99, 255, 0.2)',
};

export const FONTS = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const PIPELINE_STEPS = [
  { id: 'script', label: 'Script', icon: 'document-text', color: COLORS.stepScript },
  { id: 'prompts', label: 'Prompts', icon: 'sparkles', color: COLORS.stepPrompt },
  { id: 'images', label: 'Images', icon: 'image', color: COLORS.stepImage },
  { id: 'animation', label: 'Animation', icon: 'film', color: COLORS.stepAnimation },
  { id: 'voice', label: 'Voice', icon: 'mic', color: COLORS.stepVoice },
  { id: 'editing', label: 'Editing', icon: 'cut', color: COLORS.stepEdit },
  { id: 'export', label: 'Export', icon: 'download', color: COLORS.stepExport },
];

export const LANGUAGES = [
  { id: 'english', label: 'English', flag: '🇺🇸' },
  { id: 'hindi', label: 'Hindi', flag: '🇮🇳' },
  { id: 'hinglish', label: 'Hinglish', flag: '🇮🇳' },
];

export const VIDEO_LENGTHS = [
  { id: '30s', label: '30 sec', duration: 30 },
  { id: '1m', label: '1 min', duration: 60 },
  { id: '5m', label: '5 min', duration: 300 },
];

export const VOICE_OPTIONS = [
  { id: 'male_deep', label: 'Male (Deep)', icon: 'man' },
  { id: 'male_normal', label: 'Male', icon: 'man-outline' },
  { id: 'female', label: 'Female', icon: 'woman' },
  { id: 'female_soft', label: 'Female (Soft)', icon: 'woman-outline' },
];
