// Types for AutoDoc AI
export interface VideoProject {
  id: string;
  topic: string;
  language: string;
  videoLength: string;
  voiceType: string;
  youtubeLinks: string[];
  status: PipelineStatus;
  createdAt: string;
  completedAt?: string;
  result?: VideoResult;
  pipeline: PipelineState;
}

export type PipelineStepId =
  | 'script'
  | 'prompts'
  | 'images'
  | 'animation'
  | 'voice'
  | 'editing'
  | 'export';

export type StepStatus = 'pending' | 'processing' | 'completed' | 'error';

export type PipelineStatus =
  | 'idle'
  | 'processing'
  | 'completed'
  | 'error';

export interface PipelineStep {
  id: PipelineStepId;
  status: StepStatus;
  progress: number; // 0-100
  message?: string;
  data?: any;
}

export interface PipelineState {
  currentStep: number;
  steps: PipelineStep[];
  overallProgress: number;
}

export interface VideoResult {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  duration: number;
  resolution: string;
  fileSize: string;
  script: ScriptScene[];
  images: GeneratedImage[];
}

export interface ScriptScene {
  id: number;
  narration: string;
  visualDescription: string;
  duration: number;
}

export interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  sceneId: number;
}

export interface GenerationConfig {
  topic: string;
  language: string;
  videoLength: string;
  voiceType: string;
  youtubeLinks: string[];
}
