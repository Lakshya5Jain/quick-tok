import React, { useState, useEffect } from "react";
import { ScriptOption, VoiceOption, VideoGenerationOptions } from "@/types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ScriptOptionSelector from "./generator/ScriptOptionSelector";
import ScriptInput from "./generator/ScriptInput";
import MediaInput from "./generator/MediaInput";
import VoiceSelector from "./generator/VoiceSelector";
import SubmitButton from "./generator/SubmitButton";
import TikTokPreview from "./generator/TikTokPreview";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GeneratorFormProps {
  onSubmit: (formData: VideoGenerationOptions) => void;
  isSubmitting: boolean;
  voiceOptions: VoiceOption[];
}

const GeneratorForm: React.FC<GeneratorFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  voiceOptions 
}) => {
  // Default supporting media URL
  const defaultSupportingMedia = "https://i.makeagif.com/media/11-27-2023/Uii6jU.mp4";

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
  const [highResolution, setHighResolution] = useState(false);
  const [searchWeb, setSearchWeb] = useState(true); // Default to true for web search

  // Preview state
  const [previewVoiceMedia, setPreviewVoiceMedia] = useState<string | null>(null);
  const [previewSupportingMedia, setPreviewSupportingMedia] = useState<string | null>(null);
  
  // Get current script based on selected option
  const currentScript = scriptOption === ScriptOption.GPT 
    ? topic 
    : scriptOption === ScriptOption.CUSTOM 
      ? customScript 
      : "";

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
      voiceMedia: !useVoiceMediaFile ? voiceMedia : undefined,
      voiceMediaFile: useVoiceMediaFile ? voiceMediaFile || undefined : undefined,
      highResolution,
      searchWeb: true, // Always search the web
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
    <div className="flex flex-col md:flex-row gap-8 w-full">
      {/* Form Section */}
      <motion.div 
        className="flex-1 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800"
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
            onSearchWebChange={setSearchWeb}
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
            description="Image shown at the top of your TikTok"
            useFile={useVoiceMediaFile}
            onToggleUseFile={setUseVoiceMediaFile}
            url={voiceMedia}
            onUrlChange={setVoiceMedia}
            onFileChange={setVoiceMediaFile}
            urlPlaceholder="Enter URL for voice character image"
            fileAccept="image/jpeg,image/jpg,image/png"
            selectedFile={voiceMediaFile}
            onMediaAvailable={(isAvailable, mediaUrl) => setPreviewVoiceMedia(mediaUrl)}
          />
          
          {/* Supporting Media Input */}
          <MediaInput 
            title="Supporting Media"
            description="Video/image shown at the bottom of your TikTok"
            useFile={useMediaFile}
            onToggleUseFile={setUseMediaFile}
            url={supportingMedia}
            onUrlChange={setSupportingMedia}
            onFileChange={setSupportingMediaFile}
            urlPlaceholder="Enter URL for supporting media"
            fileAccept="image/jpeg,image/jpg,image/png,video/mp4"
            selectedFile={supportingMediaFile}
            onMediaAvailable={(isAvailable, mediaUrl) => setPreviewSupportingMedia(mediaUrl)}
            defaultUrl={defaultSupportingMedia}
          />
          
          {/* Resolution toggle */}
          <div className="flex flex-row items-center justify-between space-x-2 pt-2">
            <div>
              <Label htmlFor="high-resolution" className="text-white">Video Resolution</Label>
              <p className="text-xs text-gray-400 mt-1">
                {highResolution ? "High resolution (640)" : "Standard resolution (320)"}
              </p>
            </div>
            <Switch
              id="high-resolution"
              checked={highResolution}
              onCheckedChange={setHighResolution}
              className="data-[state=checked]:bg-quicktok-orange"
            />
          </div>
          
          {/* Submit Button */}
          <SubmitButton 
            isSubmitting={isSubmitting} 
            label="Generate Video"
            submittingLabel="Generating..."
          />
        </form>
      </motion.div>
      
      {/* Preview Section */}
      <motion.div
        className="w-full md:w-96 p-8 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Preview</h2>
        
        <TikTokPreview
          voiceMedia={previewVoiceMedia}
          supportingMedia={previewSupportingMedia}
          script={currentScript}
        />
        
        <p className="text-gray-400 text-sm mt-6 text-center">
          This is a preview of how your TikTok will look. The actual generated video will include animation and narration.
        </p>
        
        <p className="text-gray-500 text-xs mt-4 text-center">
          Powered by Creatomate API for Automated Video Generation<br />
          and Lemon Slice for Talking Avatar
        </p>
      </motion.div>
    </div>
  );
};

export default GeneratorForm;
