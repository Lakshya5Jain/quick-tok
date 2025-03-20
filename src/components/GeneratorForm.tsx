
import React, { useState } from "react";
import { ScriptOption, VoiceOption } from "@/types";
import { motion } from "framer-motion";
import { voiceOptions } from "@/data/mockData";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GeneratorFormProps {
  onSubmit: (formData: {
    scriptOption: ScriptOption;
    topic?: string;
    customScript?: string;
    supportingMedia?: string;
    voiceId: string;
    voiceMedia: string;
  }) => void;
  isSubmitting: boolean;
}

const GeneratorForm: React.FC<GeneratorFormProps> = ({ onSubmit, isSubmitting }) => {
  const [scriptOption, setScriptOption] = useState<ScriptOption>(ScriptOption.GPT);
  const [topic, setTopic] = useState("");
  const [customScript, setCustomScript] = useState("");
  const [supportingMedia, setSupportingMedia] = useState("");
  const [voiceId, setVoiceId] = useState("LXVY607YcjqxFS3mcult");
  const [voiceMedia, setVoiceMedia] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (scriptOption === ScriptOption.GPT && !topic.trim()) {
      toast.error("Please enter a topic for GPT script generation");
      return;
    }
    
    if (scriptOption === ScriptOption.CUSTOM && !customScript.trim()) {
      toast.error("Please enter your custom script");
      return;
    }
    
    onSubmit({
      scriptOption,
      topic: scriptOption === ScriptOption.GPT ? topic : undefined,
      customScript: scriptOption === ScriptOption.CUSTOM ? customScript : undefined,
      supportingMedia: supportingMedia || undefined,
      voiceId,
      voiceMedia: voiceMedia || "https://6ammc3n5zzf5ljnz.public.blob.vercel-storage.com/inf2-image-uploads/image_8132d-DYy5ZM9i939tkiyw6ADf3oVyn6LivZ.png",
    });
  };

  return (
    <motion.div 
      className="app-card max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-medium mb-6 text-center">Create TikTok Video</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Script Option Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">Script Option</label>
          <div className="flex gap-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="gpt"
                className="h-4 w-4 text-primary"
                checked={scriptOption === ScriptOption.GPT}
                onChange={() => setScriptOption(ScriptOption.GPT)}
              />
              <label htmlFor="gpt" className="ml-2 text-sm">Generate with GPT</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="custom"
                className="h-4 w-4 text-primary"
                checked={scriptOption === ScriptOption.CUSTOM}
                onChange={() => setScriptOption(ScriptOption.CUSTOM)}
              />
              <label htmlFor="custom" className="ml-2 text-sm">I'll provide my own script</label>
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
            <label htmlFor="topic" className="block text-sm font-medium">Topic/Keyword</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., Benefits of meditation"
              className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
            <label htmlFor="customScript" className="block text-sm font-medium">Your Script</label>
            <textarea
              id="customScript"
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              rows={4}
              placeholder="Enter your script here..."
              className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </motion.div>
        )}
        
        {/* Supporting Media URL */}
        <div className="space-y-2">
          <label htmlFor="supportingMedia" className="block text-sm font-medium">
            Supporting Video or Photo URL (Optional)
          </label>
          <input
            type="url"
            id="supportingMedia"
            value={supportingMedia}
            onChange={(e) => setSupportingMedia(e.target.value)}
            placeholder="Enter URL for supporting media"
            className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        {/* Voice Selection */}
        <div className="space-y-2">
          <label htmlFor="voiceId" className="block text-sm font-medium">Select Voice</label>
          <select
            id="voiceId"
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {voiceOptions.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}{voice.description ? ` - ${voice.description}` : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Voice Character Media URL */}
        <div className="space-y-2">
          <label htmlFor="voiceMedia" className="block text-sm font-medium">
            Voice Character Media URL (Optional)
          </label>
          <input
            type="url"
            id="voiceMedia"
            value={voiceMedia}
            onChange={(e) => setVoiceMedia(e.target.value)}
            placeholder="Enter URL for voice character image"
            className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            Default will be used if left empty
          </p>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors flex items-center justify-center"
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
