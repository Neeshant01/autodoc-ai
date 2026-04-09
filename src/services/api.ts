// API Service for AutoDoc AI — Gemini AI Powered
// This service can call Gemini directly from the client OR through the backend server.
import {
  GenerationConfig,
  VideoProject,
  PipelineStepId,
  PipelineState,
  ScriptScene,
  GeneratedImage,
} from '../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Backend API URL (when running the Python server)
const API_BASE_URL = 'http://10.0.2.2:8000/api'; // Android emulator
// const API_BASE_URL = 'http://localhost:8000/api'; // Web testing

// ⚡ GEMINI API KEY — Set your key here for client-side AI generation
// Get a free key at: https://aistudio.google.com/apikey
const GEMINI_API_KEY = '';  // <-- Paste your Gemini API key here
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipelineCallback = (state: PipelineState) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createInitialPipeline(): PipelineState {
  return {
    currentStep: 0,
    overallProgress: 0,
    steps: [
      { id: 'script', status: 'pending', progress: 0 },
      { id: 'prompts', status: 'pending', progress: 0 },
      { id: 'images', status: 'pending', progress: 0 },
      { id: 'animation', status: 'pending', progress: 0 },
      { id: 'voice', status: 'pending', progress: 0 },
      { id: 'editing', status: 'pending', progress: 0 },
      { id: 'export', status: 'pending', progress: 0 },
    ],
  };
}

function parseJsonFromGemini(text: string): any {
  // Extract JSON from markdown code blocks
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (match) {
    return JSON.parse(match[1].trim());
  }
  const trimmed = text.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }
  throw new Error('Could not parse JSON from Gemini response');
}

// ---------------------------------------------------------------------------
// Gemini AI (Client-Side Direct Calls)
// ---------------------------------------------------------------------------

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${error.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generateScriptWithGemini(
  topic: string,
  language: string,
  duration: number
): Promise<ScriptScene[]> {
  const langInstruction: Record<string, string> = {
    english: 'Write the narration in English.',
    hindi: 'Write the narration in Hindi (Devanagari script).',
    hinglish:
      'Write the narration in Hinglish (Hindi words written in Roman/English script, mixed naturally with English).',
  };

  const numScenes = Math.min(8, Math.max(3, Math.floor(duration / 15)));

  const prompt = `You are an expert documentary script writer. Create a compelling, factual, and engaging documentary script about: "${topic}"

Requirements:
- Total video duration: ${duration} seconds
- Number of scenes: ${numScenes}
- ${langInstruction[language] || langInstruction.english}
- Each scene should have:
  - A captivating narration (2-4 sentences, storytelling tone)
  - A detailed visual description for AI image generation (cinematic, realistic, 16:9)
  - Duration in seconds (approximately ${Math.floor(duration / numScenes)} seconds each)
- Start with a hook that grabs attention
- Include interesting facts and data
- End with an inspiring or thought-provoking conclusion
- Narration should feel like a premium Netflix/National Geographic documentary

Return ONLY a JSON array:
\`\`\`json
[
  {
    "id": 1,
    "narration": "The narration text...",
    "visualDescription": "Detailed image description: subject, composition, lighting, camera angle, mood, style...",
    "duration": ${Math.floor(duration / numScenes)}
  }
]
\`\`\``;

  const response = await callGemini(prompt);
  return parseJsonFromGemini(response);
}

async function generatePromptsWithGemini(
  scenes: ScriptScene[],
  topic: string
): Promise<any[]> {
  const scenesText = scenes
    .map((s) => `Scene ${s.id}: ${s.visualDescription}`)
    .join('\n');

  const prompt = `You are an expert AI image prompt engineer. Convert these documentary scene descriptions into optimized image generation prompts.

Topic: "${topic}"
Scenes:
${scenesText}

Requirements:
- Each prompt must be highly detailed and cinematic
- Include: subject, composition, lighting, camera angle, color palette, mood, style
- Add quality boosters: "photorealistic, 8K, cinematic composition, dramatic lighting, ultra-detailed"
- Ensure visual consistency across all scenes
- Also provide a negative prompt for each

Return ONLY a JSON array:
\`\`\`json
[
  {
    "sceneId": 1,
    "prompt": "The detailed positive prompt...",
    "negativePrompt": "Things to avoid...",
    "cameraMovement": "slow zoom in / pan left / static"
  }
]
\`\`\``;

  const response = await callGemini(prompt);
  return parseJsonFromGemini(response);
}

async function generateMetadataWithGemini(
  topic: string,
  script: ScriptScene[],
  language: string
): Promise<{ title: string; description: string; tags: string[] }> {
  const narrations = script.map((s) => s.narration).join(' ');

  const prompt = `You are a YouTube SEO expert. Generate optimized metadata for a documentary video.

Topic: "${topic}"
Language: ${language}
Script summary: ${narrations.substring(0, 500)}

Generate:
1. An attention-grabbing YouTube title (max 80 chars)
2. A compelling description (150-200 words)
3. 15-20 relevant tags for discoverability

Return ONLY JSON:
\`\`\`json
{
  "title": "The video title...",
  "description": "The full description...",
  "tags": ["tag1", "tag2"]
}
\`\`\``;

  const response = await callGemini(prompt);
  return parseJsonFromGemini(response);
}

// ---------------------------------------------------------------------------
// Pipeline Step Progress (with real Gemini integration)
// ---------------------------------------------------------------------------

async function runStepProgress(
  pipeline: PipelineState,
  stepIndex: number,
  onUpdate: PipelineCallback,
  messages: string[],
  stepDuration: number = 3000
): Promise<void> {
  const step = pipeline.steps[stepIndex];
  const increment = 100 / messages.length;
  const stepDelay = stepDuration / messages.length;

  pipeline.steps[stepIndex] = { ...step, status: 'processing', progress: 0, message: messages[0] };
  pipeline.currentStep = stepIndex;
  pipeline.overallProgress = Math.round((stepIndex * 100) / pipeline.steps.length);
  onUpdate({ ...pipeline });

  for (let i = 0; i < messages.length; i++) {
    await delay(stepDelay);
    const progress = Math.min(100, Math.round((i + 1) * increment));
    pipeline.steps[stepIndex] = {
      ...step,
      status: i === messages.length - 1 ? 'completed' : 'processing',
      progress,
      message: messages[i],
    };
    pipeline.overallProgress = Math.round((stepIndex * 100 + progress) / pipeline.steps.length);
    onUpdate({ ...pipeline });
  }
}

// ---------------------------------------------------------------------------
// Main Generation Function — Gemini AI Powered
// ---------------------------------------------------------------------------

export async function generateVideo(
  config: GenerationConfig,
  onUpdate: PipelineCallback
): Promise<VideoProject> {
  let pipeline = createInitialPipeline();
  onUpdate(pipeline);

  const projectId = `proj_${Date.now()}`;
  const durationMap: Record<string, number> = { '30s': 30, '1m': 60, '5m': 300 };
  const duration = durationMap[config.videoLength] || 60;

  const useGemini = !!GEMINI_API_KEY;
  let generatedScript: ScriptScene[] | null = null;
  let generatedPrompts: any[] | null = null;
  let generatedMetadata: { title: string; description: string; tags: string[] } | null = null;

  // ─── STEP 1: Script Generation (Gemini AI) ────────────────────────────
  if (useGemini) {
    const step = pipeline.steps[0];
    pipeline.steps[0] = { ...step, status: 'processing', progress: 10, message: 'Connecting to Gemini AI...' };
    pipeline.currentStep = 0;
    pipeline.overallProgress = 2;
    onUpdate({ ...pipeline });
    await delay(500);

    pipeline.steps[0] = { ...step, status: 'processing', progress: 30, message: 'Gemini is writing your script...' };
    pipeline.overallProgress = 5;
    onUpdate({ ...pipeline });

    try {
      generatedScript = await generateScriptWithGemini(config.topic, config.language, duration);

      pipeline.steps[0] = {
        ...step,
        status: 'processing',
        progress: 80,
        message: `Generated ${generatedScript.length} scenes with AI!`,
      };
      pipeline.overallProgress = 12;
      onUpdate({ ...pipeline });
      await delay(500);

      pipeline.steps[0] = { ...step, status: 'completed', progress: 100, message: 'Script complete! ✨' };
      pipeline.overallProgress = 14;
      onUpdate({ ...pipeline });
    } catch (error: any) {
      console.warn('Gemini script generation failed, using fallback:', error.message);
      pipeline.steps[0] = {
        ...step,
        status: 'processing',
        progress: 60,
        message: 'AI fallback: generating template script...',
      };
      onUpdate({ ...pipeline });
      await delay(1000);
      pipeline.steps[0] = { ...step, status: 'completed', progress: 100, message: 'Script ready (fallback)' };
      pipeline.overallProgress = 14;
      onUpdate({ ...pipeline });
    }
  } else {
    await runStepProgress(pipeline, 0, onUpdate, [
      'Analyzing topic...',
      'Generating script outline...',
      'Writing narration...',
      'Dividing into scenes...',
      'Script complete!',
    ], 4000);
  }

  // ─── STEP 2: Prompt Generation (Gemini AI) ────────────────────────────
  if (useGemini && generatedScript) {
    const step = pipeline.steps[1];
    pipeline.steps[1] = { ...step, status: 'processing', progress: 20, message: 'Sending scenes to Gemini...' };
    pipeline.currentStep = 1;
    pipeline.overallProgress = 18;
    onUpdate({ ...pipeline });
    await delay(400);

    try {
      generatedPrompts = await generatePromptsWithGemini(generatedScript, config.topic);
      pipeline.steps[1] = {
        ...step,
        status: 'processing',
        progress: 80,
        message: `Created ${generatedPrompts.length} cinematic prompts!`,
      };
      pipeline.overallProgress = 26;
      onUpdate({ ...pipeline });
      await delay(400);
    } catch (error: any) {
      console.warn('Gemini prompt generation failed:', error.message);
    }

    pipeline.steps[1] = { ...step, status: 'completed', progress: 100, message: 'Prompts ready! ✨' };
    pipeline.overallProgress = 28;
    onUpdate({ ...pipeline });
  } else {
    await runStepProgress(pipeline, 1, onUpdate, [
      'Creating image prompts...',
      'Optimizing for cinematic style...',
      'Adding camera directions...',
      'Prompts ready!',
    ], 3000);
  }

  // ─── STEP 3: Image Generation (simulated) ─────────────────────────────
  await runStepProgress(pipeline, 2, onUpdate, [
    'Initializing image model...',
    'Generating scene 1...',
    'Generating scene 2...',
    'Generating scene 3...',
    'Generating scene 4...',
    'All images generated!',
  ], 5000);

  // ─── STEP 4: Video Animation (simulated) ──────────────────────────────
  await runStepProgress(pipeline, 3, onUpdate, [
    'Setting up animation engine...',
    'Applying Ken Burns effect...',
    'Adding zoom & pan effects...',
    'Rendering clips...',
    'Animation done!',
  ], 4000);

  // ─── STEP 5: Voiceover (simulated) ────────────────────────────────────
  await runStepProgress(pipeline, 4, onUpdate, [
    'Loading voice model...',
    'Generating voiceover...',
    'Applying voice effects...',
    'Syncing audio...',
    'Voiceover complete!',
  ], 3500);

  // ─── STEP 6: Video Editing (simulated) ────────────────────────────────
  await runStepProgress(pipeline, 5, onUpdate, [
    'Importing assets...',
    'Aligning clips with audio...',
    'Adding transitions...',
    'Adding background music...',
    'Color grading...',
    'Final edit ready!',
  ], 4500);

  // ─── STEP 7: Export ────────────────────────────────────────────────────
  // Also generate metadata with Gemini during export
  if (useGemini && generatedScript) {
    const step = pipeline.steps[6];
    pipeline.steps[6] = { ...step, status: 'processing', progress: 20, message: 'Generating YouTube metadata with AI...' };
    pipeline.currentStep = 6;
    pipeline.overallProgress = 90;
    onUpdate({ ...pipeline });

    try {
      generatedMetadata = await generateMetadataWithGemini(
        config.topic,
        generatedScript,
        config.language
      );
      pipeline.steps[6] = { ...step, status: 'processing', progress: 60, message: 'Encoding video...' };
      pipeline.overallProgress = 94;
      onUpdate({ ...pipeline });
      await delay(800);
    } catch (error: any) {
      console.warn('Gemini metadata generation failed:', error.message);
    }

    pipeline.steps[6] = { ...step, status: 'processing', progress: 80, message: 'Generating thumbnail...' };
    pipeline.overallProgress = 97;
    onUpdate({ ...pipeline });
    await delay(600);

    pipeline.steps[6] = { ...step, status: 'completed', progress: 100, message: 'Export complete! 🎬' };
    pipeline.overallProgress = 100;
    onUpdate({ ...pipeline });
  } else {
    await runStepProgress(pipeline, 6, onUpdate, [
      'Encoding video...',
      'Applying 1080p settings...',
      'Generating thumbnail...',
      'Creating metadata...',
      'Export complete!',
    ], 3000);
  }

  // ─── Final State ──────────────────────────────────────────────────────
  pipeline.overallProgress = 100;
  onUpdate(pipeline);

  // Build script data (AI-generated or fallback)
  const finalScript: ScriptScene[] = generatedScript || [
    {
      id: 1,
      narration: `In the vast expanse of our universe, ${config.topic} stands as one of the most fascinating subjects ever explored.`,
      visualDescription: `Wide establishing shot of ${config.topic} theme, cinematic golden hour lighting, 8K quality`,
      duration: Math.floor(duration / 4),
    },
    {
      id: 2,
      narration: `Scientists have spent decades unraveling the mysteries of ${config.topic}, and what they've found has left the world in awe.`,
      visualDescription: 'Scientists working in a modern observatory, warm lighting, medium shot',
      duration: Math.floor(duration / 4),
    },
    {
      id: 3,
      narration: `From the smallest details to the grandest scale, every discovery about ${config.topic} opens a new chapter in our understanding.`,
      visualDescription: `Detailed visualization of ${config.topic} concepts, dramatic lighting, close-up`,
      duration: Math.floor(duration / 4),
    },
    {
      id: 4,
      narration: `The journey of understanding ${config.topic} continues, inspiring future generations of thinkers and dreamers.`,
      visualDescription: 'Inspirational landscape at sunset, silhouettes of people, wide angle, golden hour',
      duration: Math.floor(duration / 4),
    },
  ];

  const finalMetadata = generatedMetadata || {
    title: `${config.topic} — A Documentary`,
    description: `An AI-generated documentary about ${config.topic}. This video explores the fascinating world of ${config.topic} through stunning visuals and engaging narration.`,
    tags: config.topic.split(' ').concat(['documentary', 'AI', 'AutoDocAI', 'educational']),
  };

  const finalImages: GeneratedImage[] = finalScript.map((scene, i) => ({
    id: scene.id,
    url: `https://picsum.photos/seed/scene${scene.id}${config.topic.replace(/\s/g, '').substring(0, 5)}/1920/1080`,
    prompt: generatedPrompts?.[i]?.prompt || scene.visualDescription,
    sceneId: scene.id,
  }));

  return {
    id: projectId,
    topic: config.topic,
    language: config.language,
    videoLength: config.videoLength,
    voiceType: config.voiceType,
    youtubeLinks: config.youtubeLinks,
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    pipeline,
    result: {
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: `https://picsum.photos/seed/${config.topic.replace(/\s/g, '')}/1920/1080`,
      title: finalMetadata.title,
      description: finalMetadata.description,
      tags: finalMetadata.tags,
      duration,
      resolution: '1920x1080',
      fileSize: '47.2 MB',
      script: finalScript,
      images: finalImages,
    },
  };
}

// ---------------------------------------------------------------------------
// Backend API Call (when Python server is running)
// ---------------------------------------------------------------------------

export async function generateVideoWithAPI(
  config: GenerationConfig,
  onUpdate: PipelineCallback
): Promise<VideoProject | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('API not available');
    }

    const result = await response.json();

    // Convert API response to VideoProject format
    return {
      id: result.id,
      topic: result.topic,
      language: result.language,
      videoLength: result.videoLength,
      voiceType: result.voiceType,
      youtubeLinks: config.youtubeLinks,
      status: 'completed',
      createdAt: result.createdAt,
      completedAt: result.completedAt,
      pipeline: createInitialPipeline(),
      result: result.result,
    };
  } catch (error) {
    // Fallback to client-side generation
    return null;
  }
}
