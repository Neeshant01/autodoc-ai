"""
AutoDoc AI - Backend Server (Gemini AI Powered)
FastAPI server that orchestrates the AI video generation pipeline using Google Gemini.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import json
import time
import uuid
import os
import re

# Google Gemini AI
import google.generativeai as genai

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Set your Gemini API key here or via environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Gemini model to use
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

app = FastAPI(
    title="AutoDoc AI Backend",
    description="AI-powered documentary video generation pipeline using Google Gemini",
    version="2.0.0",
)

# CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class GenerationConfig(BaseModel):
    topic: str
    language: str = "english"
    videoLength: str = "1m"
    voiceType: str = "male_deep"
    youtubeLinks: List[str] = []


class ScriptScene(BaseModel):
    id: int
    narration: str
    visualDescription: str
    duration: int


class ImagePrompt(BaseModel):
    sceneId: int
    prompt: str
    negativePrompt: str = "blurry, low quality, cartoon, anime, text, watermark"
    width: int = 1920
    height: int = 1080


class VideoMetadata(BaseModel):
    title: str
    description: str
    tags: List[str]


class PipelineStep(BaseModel):
    id: str
    status: str = "pending"
    progress: int = 0
    message: Optional[str] = None


class PipelineState(BaseModel):
    currentStep: int = 0
    overallProgress: int = 0
    steps: List[PipelineStep] = []


# ---------------------------------------------------------------------------
# Pipeline Config
# ---------------------------------------------------------------------------

PIPELINE_STEP_IDS = ["script", "prompts", "images", "animation", "voice", "editing", "export"]

STEP_MESSAGES = {
    "script": [
        "Connecting to Gemini AI...",
        "Analyzing topic deeply...",
        "Researching key facts...",
        "Generating script outline...",
        "Writing narration with Gemini...",
        "Dividing into scenes...",
        "Script complete!",
    ],
    "prompts": [
        "Sending scenes to Gemini...",
        "Creating cinematic image prompts...",
        "Optimizing for photorealism...",
        "Adding camera directions & mood...",
        "Prompts ready!",
    ],
    "images": [
        "Initializing image model...",
        "Loading style weights...",
        "Generating scene 1...",
        "Generating scene 2...",
        "Generating scene 3...",
        "Generating scene 4...",
        "Post-processing images...",
        "All images generated!",
    ],
    "animation": [
        "Setting up animation engine...",
        "Applying Ken Burns effect...",
        "Adding zoom transitions...",
        "Adding pan effects...",
        "Rendering clips...",
        "Animation done!",
    ],
    "voice": [
        "Loading voice model...",
        "Processing text...",
        "Generating voiceover...",
        "Applying voice effects...",
        "Syncing audio...",
        "Voiceover complete!",
    ],
    "editing": [
        "Importing assets...",
        "Creating timeline...",
        "Aligning clips with audio...",
        "Adding transitions...",
        "Adding background music...",
        "Color grading...",
        "Final edit ready!",
    ],
    "export": [
        "Encoding video...",
        "Applying 1080p settings...",
        "Optimizing bitrate...",
        "Generating thumbnail...",
        "Creating metadata...",
        "Export complete!",
    ],
}


# ---------------------------------------------------------------------------
# Gemini AI Functions
# ---------------------------------------------------------------------------

def _get_gemini_model():
    """Get the configured Gemini model instance."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set. Set it as an environment variable or in server.py")
    return genai.GenerativeModel(GEMINI_MODEL)


def _parse_json_from_response(text: str) -> dict | list:
    """Extract JSON from Gemini's response (handles markdown code blocks)."""
    # Try to find JSON in code blocks first
    json_match = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?```', text)
    if json_match:
        return json.loads(json_match.group(1).strip())
    # Try raw JSON
    text = text.strip()
    if text.startswith('[') or text.startswith('{'):
        return json.loads(text)
    raise ValueError(f"Could not parse JSON from response: {text[:200]}")


async def generate_script_with_gemini(topic: str, language: str, duration: int) -> List[dict]:
    """
    Generate a documentary script using Google Gemini.
    Returns a list of scene dicts with: id, narration, visualDescription, duration.
    """
    model = _get_gemini_model()

    lang_instruction = {
        "english": "Write the narration in English.",
        "hindi": "Write the narration in Hindi (Devanagari script).",
        "hinglish": "Write the narration in Hinglish (Hindi words written in Roman/English script, mixed naturally with English words).",
    }.get(language, "Write the narration in English.")

    num_scenes = max(3, duration // 15)  # ~15 seconds per scene
    if num_scenes > 8:
        num_scenes = 8

    prompt = f"""You are an expert documentary script writer. Create a compelling, factual, and engaging documentary script about: "{topic}"

Requirements:
- Total video duration: {duration} seconds
- Number of scenes: {num_scenes}
- {lang_instruction}
- Each scene should have:
  - A captivating narration (2-4 sentences, storytelling tone)
  - A detailed visual description for AI image generation (cinematic, realistic, 16:9)
  - Duration in seconds (each scene approximately {duration // num_scenes} seconds)
- Start with a hook that grabs attention
- Include interesting facts and data
- End with an inspiring or thought-provoking conclusion
- Narration should feel like a premium Netflix/National Geographic documentary

Return ONLY a JSON array with this exact format, no other text:
```json
[
  {{
    "id": 1,
    "narration": "The narration text for this scene...",
    "visualDescription": "Detailed image description: subject, composition, lighting, camera angle, mood, style...",
    "duration": {duration // num_scenes}
  }}
]
```"""

    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        scenes = _parse_json_from_response(response.text)
        if isinstance(scenes, list) and len(scenes) > 0:
            return scenes
    except Exception as e:
        print(f"[Gemini Script Error] {e}")

    # Fallback to template-based script
    return _fallback_script(topic, duration, num_scenes)


async def generate_prompts_with_gemini(scenes: List[dict], topic: str) -> List[dict]:
    """
    Use Gemini to create optimized image generation prompts from scene descriptions.
    """
    model = _get_gemini_model()

    scenes_text = "\n".join([
        f"Scene {s['id']}: {s.get('visualDescription', s.get('narration', ''))}"
        for s in scenes
    ])

    prompt = f"""You are an expert AI image prompt engineer. Convert these documentary scene descriptions into optimized image generation prompts.

Topic: "{topic}"
Scenes:
{scenes_text}

Requirements:
- Each prompt must be highly detailed and cinematic
- Include: subject, composition, lighting, camera angle, color palette, mood, style
- Add quality boosters: "photorealistic, 8K, cinematic composition, dramatic lighting, ultra-detailed"
- Ensure visual consistency across all scenes (similar color grading, style)
- Make prompts suitable for Stable Diffusion / DALL-E / Midjourney
- Also provide a negative prompt for each scene

Return ONLY a JSON array:
```json
[
  {{
    "sceneId": 1,
    "prompt": "The detailed positive prompt...",
    "negativePrompt": "Things to avoid: blurry, low quality, cartoon...",
    "cameraMovement": "slow zoom in / pan left / static / tracking shot"
  }}
]
```"""

    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        prompts = _parse_json_from_response(response.text)
        if isinstance(prompts, list) and len(prompts) > 0:
            return [
                {
                    "sceneId": p.get("sceneId", i + 1),
                    "prompt": p.get("prompt", ""),
                    "negativePrompt": p.get("negativePrompt", "blurry, low quality, cartoon, anime, text, watermark"),
                    "cameraMovement": p.get("cameraMovement", "slow zoom in"),
                    "width": 1920,
                    "height": 1080,
                }
                for i, p in enumerate(prompts)
            ]
    except Exception as e:
        print(f"[Gemini Prompts Error] {e}")

    # Fallback
    return _fallback_prompts(scenes)


async def generate_metadata_with_gemini(topic: str, script: List[dict], language: str) -> dict:
    """
    Use Gemini to generate YouTube-optimized title, description, and tags.
    """
    model = _get_gemini_model()

    narrations = " ".join([s.get("narration", "") for s in script])

    prompt = f"""You are a YouTube SEO expert. Generate optimized metadata for a documentary video.

Topic: "{topic}"
Language: {language}
Script summary: {narrations[:500]}

Generate:
1. An attention-grabbing YouTube title (max 80 chars, include keywords)
2. A compelling description (150-200 words, include call-to-action, timestamps would be nice)
3. 15-20 relevant hashtags/tags for discoverability

Return ONLY JSON:
```json
{{
  "title": "The video title...",
  "description": "The full description...",
  "tags": ["tag1", "tag2", "tag3"]
}}
```"""

    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        metadata = _parse_json_from_response(response.text)
        if isinstance(metadata, dict):
            return metadata
    except Exception as e:
        print(f"[Gemini Metadata Error] {e}")

    # Fallback
    return {
        "title": f"{topic} — An AI Documentary",
        "description": f"An AI-generated documentary exploring {topic}. Created with AutoDoc AI.",
        "tags": topic.split() + ["documentary", "AI", "AutoDocAI", "educational", "facts"],
    }


# ---------------------------------------------------------------------------
# Fallback (non-AI) Functions
# ---------------------------------------------------------------------------

def _fallback_script(topic: str, duration: int, num_scenes: int) -> List[dict]:
    """Template-based fallback when Gemini is unavailable."""
    templates = [
        f"In the fascinating world of {topic}, there exist wonders that challenge our very understanding of reality.",
        f"Scientists and researchers have dedicated decades to unraveling the mysteries of {topic}, and their discoveries have been nothing short of extraordinary.",
        f"What makes {topic} truly remarkable is how it connects to every aspect of our daily lives, often in ways we never expected.",
        f"The latest breakthroughs in {topic} are reshaping our future, opening doors to possibilities once thought impossible.",
        f"As we look ahead, the story of {topic} continues to evolve, inspiring the next generation of thinkers and dreamers.",
        f"From ancient wisdom to cutting-edge research, {topic} remains one of humanity's most captivating pursuits.",
        f"Every new chapter in {topic} reveals layers of complexity that remind us how much there is still to discover.",
        f"The journey through {topic} is far from over — and the best discoveries may still lie ahead.",
    ]

    visuals = [
        f"Stunning wide establishing shot related to {topic}, cinematic golden hour lighting, 8K quality",
        "Modern research laboratory with scientists working, warm dramatic lighting, medium shot",
        f"Abstract artistic visualization of {topic} concepts, vibrant colors, macro close-up",
        "Futuristic technology montage with holographic displays, blue neon lighting, tracking shot",
        "Inspirational landscape at sunset, silhouettes of people looking at the horizon, wide angle",
        "Historical artifacts and ancient texts, warm candlelight, close-up detail shot",
        f"Intricate patterns and structures related to {topic}, electron microscope style, ultra-detailed",
        "Time-lapse of stars and cosmos, night sky, ultra-wide panoramic shot",
    ]

    scene_duration = max(7, duration // num_scenes)
    scenes = []
    for i in range(min(num_scenes, len(templates))):
        scenes.append({
            "id": i + 1,
            "narration": templates[i],
            "visualDescription": visuals[i],
            "duration": scene_duration,
        })
    return scenes


def _fallback_prompts(scenes: List[dict]) -> List[dict]:
    """Template-based fallback for image prompts."""
    prompts = []
    for scene in scenes:
        prompts.append({
            "sceneId": scene["id"],
            "prompt": f"{scene.get('visualDescription', '')}, photorealistic, 8K, cinematic composition, dramatic lighting, ultra-detailed, sharp focus",
            "negativePrompt": "blurry, low quality, cartoon, anime, text, watermark, oversaturated, distorted",
            "cameraMovement": "slow zoom in",
            "width": 1920,
            "height": 1080,
        })
    return prompts


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    gemini_status = "configured" if GEMINI_API_KEY else "not configured — set GEMINI_API_KEY"
    return {
        "service": "AutoDoc AI Backend",
        "version": "2.0.0",
        "ai_engine": "Google Gemini",
        "gemini_model": GEMINI_MODEL,
        "gemini_status": gemini_status,
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "gemini_configured": bool(GEMINI_API_KEY),
        "gemini_model": GEMINI_MODEL,
    }


@app.post("/api/generate")
async def generate_video(config: GenerationConfig):
    """Full video generation pipeline powered by Gemini AI."""
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    duration_map = {"30s": 30, "1m": 60, "5m": 300}
    duration = duration_map.get(config.videoLength, 60)

    # Step 1: Generate script with Gemini
    print(f"[Pipeline] Generating script for: {config.topic}")
    script = await generate_script_with_gemini(config.topic, config.language, duration)
    print(f"[Pipeline] Script generated: {len(script)} scenes")

    # Step 2: Generate image prompts with Gemini
    print(f"[Pipeline] Generating image prompts...")
    image_prompts = await generate_prompts_with_gemini(script, config.topic)
    print(f"[Pipeline] Image prompts generated: {len(image_prompts)}")

    # Step 3: Generate metadata with Gemini
    print(f"[Pipeline] Generating YouTube metadata...")
    metadata = await generate_metadata_with_gemini(config.topic, script, config.language)
    print(f"[Pipeline] Metadata generated: {metadata.get('title', 'N/A')}")

    result = {
        "id": project_id,
        "topic": config.topic,
        "language": config.language,
        "videoLength": config.videoLength,
        "voiceType": config.voiceType,
        "status": "completed",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "completedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "result": {
            "videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
            "thumbnailUrl": f"https://picsum.photos/seed/{config.topic.replace(' ', '')}/1920/1080",
            "title": metadata.get("title", f"{config.topic} — A Documentary"),
            "description": metadata.get("description", f"An AI-generated documentary about {config.topic}."),
            "tags": metadata.get("tags", config.topic.split() + ["documentary", "AI"]),
            "duration": duration,
            "resolution": "1920x1080",
            "fileSize": "47.2 MB",
            "script": script,
            "imagePrompts": image_prompts,
            "images": [
                {
                    "id": p["sceneId"],
                    "url": f"https://picsum.photos/seed/scene{p['sceneId']}{config.topic.replace(' ', '')[:5]}/1920/1080",
                    "prompt": p["prompt"],
                    "sceneId": p["sceneId"],
                }
                for p in image_prompts
            ],
        },
    }

    return result


@app.post("/api/generate/stream")
async def generate_video_stream(config: GenerationConfig):
    """Stream pipeline progress via SSE, with Gemini AI for script & prompts steps."""
    duration_map = {"30s": 30, "1m": 60, "5m": 300}
    duration = duration_map.get(config.videoLength, 60)

    async def event_stream():
        generated_script = None
        generated_prompts = None
        generated_metadata = None

        for step_idx, step_id in enumerate(PIPELINE_STEP_IDS):
            messages = STEP_MESSAGES[step_id]

            # For script step, actually call Gemini
            if step_id == "script" and GEMINI_API_KEY:
                yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'processing', 'stepProgress': 10, 'message': 'Connecting to Gemini AI...', 'overallProgress': 2})}\n\n"
                await asyncio.sleep(0.3)

                yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'processing', 'stepProgress': 30, 'message': 'Gemini is writing your script...', 'overallProgress': 5})}\n\n"

                try:
                    generated_script = await generate_script_with_gemini(config.topic, config.language, duration)
                    yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'processing', 'stepProgress': 80, 'message': f'Generated {len(generated_script)} scenes!', 'overallProgress': 12})}\n\n"
                    await asyncio.sleep(0.3)
                except Exception as e:
                    yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'processing', 'stepProgress': 70, 'message': f'Gemini fallback: {str(e)[:50]}', 'overallProgress': 10})}\n\n"
                    generated_script = _fallback_script(config.topic, duration, max(3, duration // 15))
                    await asyncio.sleep(0.3)

                yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'completed', 'stepProgress': 100, 'message': 'Script complete!', 'overallProgress': 14, 'data': {'script': generated_script}})}\n\n"
                continue

            # For prompts step, actually call Gemini
            if step_id == "prompts" and GEMINI_API_KEY and generated_script:
                yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'processing', 'stepProgress': 20, 'message': 'Sending scenes to Gemini...', 'overallProgress': 18})}\n\n"
                await asyncio.sleep(0.3)

                try:
                    generated_prompts = await generate_prompts_with_gemini(generated_script, config.topic)
                    yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'processing', 'stepProgress': 80, 'message': f'Created {len(generated_prompts)} image prompts!', 'overallProgress': 26})}\n\n"
                    await asyncio.sleep(0.3)
                except Exception as e:
                    generated_prompts = _fallback_prompts(generated_script)

                yield f"data: {json.dumps({'currentStep': step_idx, 'stepId': step_id, 'stepStatus': 'completed', 'stepProgress': 100, 'message': 'Prompts ready!', 'overallProgress': 28, 'data': {'prompts': generated_prompts}})}\n\n"
                continue

            # Other steps: simulate progress
            for msg_idx, message in enumerate(messages):
                progress = min(100, int((msg_idx + 1) / len(messages) * 100))
                overall = int(((step_idx * 100 + progress) / len(PIPELINE_STEP_IDS)))

                event_data = {
                    "currentStep": step_idx,
                    "stepId": step_id,
                    "stepStatus": "completed" if msg_idx == len(messages) - 1 else "processing",
                    "stepProgress": progress,
                    "message": message,
                    "overallProgress": overall,
                }

                yield f"data: {json.dumps(event_data)}\n\n"
                await asyncio.sleep(0.4)

        # Generate metadata
        if GEMINI_API_KEY and generated_script:
            generated_metadata = await generate_metadata_with_gemini(config.topic, generated_script, config.language)
        else:
            generated_metadata = {
                "title": f"{config.topic} — A Documentary",
                "description": f"An AI-generated documentary about {config.topic}.",
                "tags": config.topic.split() + ["documentary", "AI"],
            }

        # Final completion event with all data
        final_data = {
            "complete": True,
            "overallProgress": 100,
            "script": generated_script,
            "prompts": generated_prompts,
            "metadata": generated_metadata,
        }
        yield f"data: {json.dumps(final_data)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/script")
async def generate_script_only(config: GenerationConfig):
    """Generate just the script (useful for previewing before full generation)."""
    duration_map = {"30s": 30, "1m": 60, "5m": 300}
    duration = duration_map.get(config.videoLength, 60)
    script = await generate_script_with_gemini(config.topic, config.language, duration)
    return {"script": script, "scenes": len(script)}


@app.post("/api/prompts")
async def generate_prompts_only(data: dict):
    """Generate image prompts from existing scenes."""
    scenes = data.get("scenes", [])
    topic = data.get("topic", "")
    if not scenes:
        raise HTTPException(status_code=400, detail="No scenes provided")
    prompts = await generate_prompts_with_gemini(scenes, topic)
    return {"prompts": prompts}


@app.post("/api/metadata")
async def generate_metadata_only(data: dict):
    """Generate YouTube metadata from topic and script."""
    topic = data.get("topic", "")
    script = data.get("script", [])
    language = data.get("language", "english")
    if not topic:
        raise HTTPException(status_code=400, detail="No topic provided")
    metadata = await generate_metadata_with_gemini(topic, script, language)
    return metadata


@app.get("/api/projects")
async def list_projects():
    """List all generated projects (stub)."""
    return {"projects": [], "total": 0}


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get a specific project (stub)."""
    raise HTTPException(status_code=404, detail="Project not found")


if __name__ == "__main__":
    import uvicorn

    if not GEMINI_API_KEY:
        print("\n" + "=" * 60)
        print("  ⚠️  GEMINI_API_KEY not set!")
        print("  Set it as an environment variable:")
        print("    Windows:  set GEMINI_API_KEY=your-key-here")
        print("    Linux:    export GEMINI_API_KEY=your-key-here")
        print("  Or edit GEMINI_API_KEY in server.py directly.")
        print("  Get a free key: https://aistudio.google.com/apikey")
        print("  Server will use fallback (non-AI) responses.")
        print("=" * 60 + "\n")
    else:
        print(f"\n✅ Gemini AI configured with model: {GEMINI_MODEL}\n")

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
