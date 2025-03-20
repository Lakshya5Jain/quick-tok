
export interface Video {
  id: string;
  finalVideoUrl: string;
  scriptText: string;
  timestamp: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

export interface GenerationProgress {
  progress: number;
  status: string;
  finalVideoUrl?: string;
  scriptText?: string;
  aiVideoUrl?: string;
}

export enum ScriptOption {
  GPT = "gpt",
  CUSTOM = "custom"
}
