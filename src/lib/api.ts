
import { delay, generateUUID } from './utils';
import { GenerationProgress, Video, ScriptOption } from '@/types';
import { mockVideos } from '@/data/mockData';

// Simulated API for generating scripts
export async function generateScript(topic: string): Promise<string> {
  // In a real implementation, this would call an API endpoint
  await delay(1500);
  
  return `Here's an engaging script about ${topic}: 
  
Did you know that ${topic} is becoming increasingly important in our daily lives? Studies show that understanding ${topic} can lead to improved wellbeing and productivity. 

Let me share 3 key insights about ${topic} that might surprise you.

First, regular engagement with ${topic} has been linked to reduced stress levels and better sleep quality.

Second, experts recommend incorporating ${topic} into your routine at least 3 times per week for optimal benefits.

Finally, ${topic} has been shown to improve cognitive function and memory retention in people of all ages.

Try implementing these tips today and see the difference for yourself!`;
}

// Simulated API for video generation process
export async function generateVideo(formData: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  voiceId: string;
  voiceMedia: string;
}): Promise<string> {
  // Generate process ID
  const processId = generateUUID();
  return processId;
}

// Simulated API to check progress
export async function checkProgress(processId: string): Promise<GenerationProgress> {
  // This would be a real API call in production
  // For demo purposes, we'll simulate the progress
  
  const progressData = localStorage.getItem(`progress_${processId}`);
  if (!progressData) {
    // Initialize progress
    const initial: GenerationProgress = {
      progress: 0,
      status: "Starting...",
    };
    localStorage.setItem(`progress_${processId}`, JSON.stringify(initial));
    return initial;
  }
  
  const current: GenerationProgress = JSON.parse(progressData);
  
  // If already complete, return as is
  if (current.progress >= 100) {
    return current;
  }
  
  // Simulate progress update
  let updated: GenerationProgress;
  
  if (current.progress < 25) {
    updated = {
      ...current,
      progress: 25,
      status: "Generating script...",
    };
  } else if (current.progress < 50) {
    updated = {
      ...current,
      progress: 50,
      status: "Creating AI video...",
    };
  } else if (current.progress < 75) {
    updated = {
      ...current,
      progress: 75,
      status: "Finalizing video...",
    };
  } else {
    // Complete the process
    updated = {
      progress: 100,
      status: "Complete!",
      finalVideoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      scriptText: "This is a sample generated script that would have been created based on your topic. It demonstrates how the video generator works, using AI to create engaging content for TikTok and other social media platforms. The script is optimized for text-to-speech conversion, ensuring clear and natural-sounding narration.",
      aiVideoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    };
    
    // Add to videos list
    const newVideo: Video = {
      id: generateUUID(),
      finalVideoUrl: updated.finalVideoUrl!,
      scriptText: updated.scriptText!,
      timestamp: Date.now(),
    };
    
    const savedVideos = localStorage.getItem('videos');
    const videos = savedVideos ? JSON.parse(savedVideos) : [];
    videos.unshift(newVideo);
    localStorage.setItem('videos', JSON.stringify(videos));
  }
  
  localStorage.setItem(`progress_${processId}`, JSON.stringify(updated));
  return updated;
}

// Get saved videos
export async function getVideos(): Promise<Video[]> {
  const savedVideos = localStorage.getItem('videos');
  
  if (!savedVideos) {
    // Initialize with mock data on first run
    localStorage.setItem('videos', JSON.stringify(mockVideos));
    return mockVideos;
  }
  
  return JSON.parse(savedVideos);
}
