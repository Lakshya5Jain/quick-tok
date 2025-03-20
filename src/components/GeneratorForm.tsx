
import React, { useState } from "react";
import { ScriptOption, VoiceOption } from "@/types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ScriptOptionSelector from "./generator/ScriptOptionSelector";
import ScriptInput from "./generator/ScriptInput";
import MediaInput from "./generator/MediaInput";
import VoiceSelector from "./generator/VoiceSelector";
import SubmitButton from "./generator/SubmitButton";

interface GeneratorFormProps {
  onSubmit: (formData: {
    scriptOption: ScriptOption;
    topic?: string;
    customScript?: string;
    supportingMedia?: string;
    supportingMediaFile?: File;
    voiceId: string;
    voiceMedia?: string;
    voiceMediaFile?: File;
  }) => void;
  isSubmitting: boolean;
  voiceOptions: VoiceOption[];
}

const GeneratorForm: React.FC<GeneratorFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  voiceOptions 
}) => {
  const [scriptOption, setScriptOption] = useState<ScriptOption>(ScriptOption.GPT);
  const [topic, setTopic] = useState("");
  const [customScript, setCustomScript] = useState("");
  const [supportingMedia, setSupportingMedia] = useState("");
  const [supportingMediaFile, setSupportingMediaFile] = useState<File | null>(null);
  const [useMediaFile, setUseMediaFile] = useState(false);
  const [voiceId, setVoiceId] = useState("LXVY607YcjqxFS3mcult");
  const [voiceMedia, setVoiceMedia] = useState("");
  const [voiceMediaFile, setVoiceMediaFile] = useState<File | null>(null);
  const [useVoiceMediaFile, setUseVoiceMediaFile] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (scriptOption === ScriptOption.GPT && !topic.trim()) {
      toast.error("Please enter a topic for AI script generation");
      return;
    }
    
    if (scriptOption === ScriptOption.CUSTOM && !customScript.trim()) {
      toast.error("Please enter your custom script");
      return;
    }

    if (useMediaFile && !supportingMediaFile) {
      toast.error("Please upload a supporting media file or switch to URL input");
      return;
    }

    if (!useMediaFile && supportingMedia.trim() && !isValidUrl(supportingMedia)) {
      toast.error("Please enter a valid URL for supporting media");
      return;
    }

    if (useVoiceMediaFile && !voiceMediaFile) {
      toast.error("Please upload a voice character image or switch to URL input");
      return;
    }

    if (!useVoiceMediaFile && voiceMedia.trim() && !isValidUrl(voiceMedia)) {
      toast.error("Please enter a valid URL for voice character media");
      return;
    }
    
    onSubmit({
      scriptOption,
      topic: scriptOption === ScriptOption.GPT ? topic : undefined,
      customScript: scriptOption === ScriptOption.CUSTOM ? customScript : undefined,
      supportingMedia: !useMediaFile ? supportingMedia : undefined,
      supportingMediaFile: useMediaFile ? supportingMediaFile || undefined : undefined,
      voiceId,
      voiceMedia: !useVoiceMediaFile ? voiceMedia || "https://6ammc3n5zzf5ljnz.public.blob.vercel-storage.com/inf2-image-uploads/image_8132d-DYy5ZM9i939tkiyw6ADf3oVyn6LivZ.png" : undefined,
      voiceMediaFile: useVoiceMediaFile ? voiceMediaFile || undefined : undefined,
    });
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Create TikTok Video</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Script Option Selection */}
        <ScriptOptionSelector 
          scriptOption={scriptOption} 
          onChange={setScriptOption}
        />
        
        {/* Script Input based on selection */}
        <ScriptInput 
          scriptOption={scriptOption}
          topic={topic}
          onTopicChange={setTopic}
          customScript={customScript}
          onCustomScriptChange={setCustomScript}
        />
        
        {/* Supporting Media Input */}
        <MediaInput 
          title="Supporting Media"
          description="Upload or link to a video or image that will be shown in your TikTok video"
          useFile={useMediaFile}
          onToggleUseFile={setUseMediaFile}
          url={supportingMedia}
          onUrlChange={setSupportingMedia}
          onFileChange={setSupportingMediaFile}
          urlPlaceholder="Enter URL for supporting media"
          fileAccept="image/*,video/*"
        />
        
        {/* Voice Selection */}
        <VoiceSelector 
          voiceId={voiceId}
          onChange={setVoiceId}
          voiceOptions={voiceOptions}
        />
        
        {/* Voice Character Media Input */}
        <MediaInput 
          title="Voice Character Media"
          description="Default will be used if left empty"
          useFile={useVoiceMediaFile}
          onToggleUseFile={setUseVoiceMediaFile}
          url={voiceMedia}
          onUrlChange={setVoiceMedia}
          onFileChange={setVoiceMediaFile}
          urlPlaceholder="Enter URL for voice character image"
          fileAccept="image/*"
        />
        
        {/* Submit Button */}
        <SubmitButton 
          isSubmitting={isSubmitting} 
          label="Generate Video"
          submittingLabel="Generating..."
        />
      </form>
    </motion.div>
  );
};

export default GeneratorForm;
