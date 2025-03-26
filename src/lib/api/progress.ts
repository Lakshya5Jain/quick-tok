
import { GenerationProgress } from '@/types';
import { getProgressFromStorage } from './utils';

// Check progress of video generation
export async function checkProgress(processId: string): Promise<GenerationProgress> {
  const progress = getProgressFromStorage(processId);
  
  if (!progress) {
    throw new Error("Process not found");
  }
  
  return progress;
}
