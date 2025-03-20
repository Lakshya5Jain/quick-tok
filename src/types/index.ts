
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
  voiceId?: string;
  voiceMedia?: string;
  supportingMediaUrl?: string; // Added this missing property
}

export enum ScriptOption {
  GPT = "gpt",
  CUSTOM = "custom"
}

export interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
}
