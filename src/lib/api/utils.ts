
import { GenerationProgress } from '@/types';
import { delay, generateUUID } from '../utils';

// Local storage helpers for progress
export const getProgressFromStorage = (processId: string): GenerationProgress | null => {
  const stored = localStorage.getItem(`progress_${processId}`);
  return stored ? JSON.parse(stored) : null;
};

export const updateProgressInStorage = (processId: string, progress: Partial<GenerationProgress>) => {
  const current = getProgressFromStorage(processId) || {
    progress: 0,
    status: "Starting...",
  };
  const updated = { ...current, ...progress };
  localStorage.setItem(`progress_${processId}`, JSON.stringify(updated));
  return updated;
};
