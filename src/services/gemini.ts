// Gemini API Key configuration service
// Stores the API key in AsyncStorage so users can set it via the app UI
import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_KEY_STORAGE = '@autodocai_gemini_key';
const GEMINI_MODEL_STORAGE = '@autodocai_gemini_model';

let cachedApiKey: string | null = null;
let cachedModel: string | null = null;

export async function getGeminiApiKey(): Promise<string> {
  if (cachedApiKey !== null) return cachedApiKey;
  try {
    const key = await AsyncStorage.getItem(GEMINI_KEY_STORAGE);
    cachedApiKey = key || '';
    return cachedApiKey;
  } catch {
    return '';
  }
}

export async function setGeminiApiKey(key: string): Promise<void> {
  try {
    cachedApiKey = key;
    await AsyncStorage.setItem(GEMINI_KEY_STORAGE, key);
  } catch (error) {
    console.error('Failed to save Gemini API key:', error);
  }
}

export async function getGeminiModel(): Promise<string> {
  if (cachedModel !== null) return cachedModel;
  try {
    const model = await AsyncStorage.getItem(GEMINI_MODEL_STORAGE);
    cachedModel = model || 'gemini-2.0-flash';
    return cachedModel;
  } catch {
    return 'gemini-2.0-flash';
  }
}

export async function setGeminiModel(model: string): Promise<void> {
  try {
    cachedModel = model;
    await AsyncStorage.setItem(GEMINI_MODEL_STORAGE, model);
  } catch (error) {
    console.error('Failed to save Gemini model:', error);
  }
}

export async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const model = await getGeminiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "Hello AutoDoc AI!" in exactly those words.' }] }],
        generationConfig: { maxOutputTokens: 50 },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, message: `Connected! Gemini says: "${text.trim()}"` };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || `Error ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Connection failed' };
  }
}
