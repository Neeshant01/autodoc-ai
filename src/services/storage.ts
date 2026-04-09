// Storage service for video history
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoProject } from '../types';

const HISTORY_KEY = '@autodocai_history';

export async function saveProject(project: VideoProject): Promise<void> {
  try {
    const existing = await getHistory();
    const updated = [project, ...existing].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save project:', error);
  }
}

export async function getHistory(): Promise<VideoProject[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    const existing = await getHistory();
    const updated = existing.filter((p) => p.id !== projectId);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}
