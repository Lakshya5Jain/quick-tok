
import React, { useState } from "react";
import { ScriptOption, VoiceOption } from "@/types";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "./FileUpload";

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
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-200">Script Option</label>
          <div className="flex gap-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="gpt"
                className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
                checked={scriptOption === ScriptOption.GPT}
                onChange={() => setScriptOption(ScriptOption.GPT)}
              />
              <label htmlFor="gpt" className="ml-2 text-sm text-gray-300">Generate with AI</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="custom"
                className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
                checked={scriptOption === ScriptOption.CUSTOM}
                onChange={() => setScriptOption(ScriptOption.CUSTOM)}
              />
              <label htmlFor="custom" className="ml-2 text-sm text-gray-300">Use my own script</label>
            </div>
          </div>
        </div>
        
        {/* Topic Input (for GPT option) */}
        {scriptOption === ScriptOption.GPT && (
          <motion.div 
            className="form-transition space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label htmlFor="topic" className="block text-sm font-medium text-gray-200">Topic/Keyword</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., Benefits of meditation"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
            />
          </motion.div>
        )}
        
        {/* Custom Script Textarea (for custom option) */}
        {scriptOption === ScriptOption.CUSTOM && (
          <motion.div 
            className="form-transition space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label htmlFor="customScript" className="block text-sm font-medium text-gray-200">Your Script</label>
            <textarea
              id="customScript"
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              rows={4}
              placeholder="Enter your script here..."
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
            />
          </motion.div>
        )}
        
        {/* Supporting Media Toggle */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Supporting Media
          </label>
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="mediaUrl"
                name="mediaSource"
                checked={!useMediaFile}
                onChange={() => setUseMediaFile(false)}
                className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
              />
              <label htmlFor="mediaUrl" className="ml-2 text-sm text-gray-300">Use URL</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="mediaFile"
                name="mediaSource"
                checked={useMediaFile}
                onChange={() => setUseMediaFile(true)}
                className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
              />
              <label htmlFor="mediaFile" className="ml-2 text-sm text-gray-300">Upload File</label>
            </div>
          </div>

          {!useMediaFile ? (
            <input
              type="url"
              id="supportingMedia"
              value={supportingMedia}
              onChange={(e) => setSupportingMedia(e.target.value)}
              placeholder="Enter URL for supporting media"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
            />
          ) : (
            <FileUpload
              id="supportingMediaFile"
              label=""
              accept="image/*,video/*"
              onFileChange={setSupportingMediaFile}
            />
          )}
          <p className="text-xs text-gray-400">
            Upload or link to a video or image that will be shown in your TikTok video
          </p>
        </div>
        
        {/* Voice Selection */}
        <div className="space-y-2">
          <label htmlFor="voiceId" className="block text-sm font-medium text-gray-200">Select Voice</label>
          <select
            id="voiceId"
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
          >
            {voiceOptions.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}{voice.description ? ` - ${voice.description}` : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Voice Character Media Toggle */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Voice Character Media
          </label>
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="voiceMediaUrl"
                name="voiceMediaSource"
                checked={!useVoiceMediaFile}
                onChange={() => setUseVoiceMediaFile(false)}
                className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
              />
              <label htmlFor="voiceMediaUrl" className="ml-2 text-sm text-gray-300">Use URL</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="voiceMediaFile"
                name="voiceMediaSource"
                checked={useVoiceMediaFile}
                onChange={() => setUseVoiceMediaFile(true)}
                className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
              />
              <label htmlFor="voiceMediaFile" className="ml-2 text-sm text-gray-300">Upload File</label>
            </div>
          </div>

          {!useVoiceMediaFile ? (
            <input
              type="url"
              id="voiceMedia"
              value={voiceMedia}
              onChange={(e) => setVoiceMedia(e.target.value)}
              placeholder="Enter URL for voice character image"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
            />
          ) : (
            <FileUpload
              id="voiceMediaFile"
              label=""
              accept="image/*"
              onFileChange={setVoiceMediaFile}
            />
          )}
          <p className="text-xs text-gray-400">
            Default will be used if left empty
          </p>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-quicktok-orange text-white font-bold rounded-md hover:bg-quicktok-orange/90 focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50 transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Video"
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default GeneratorForm;
