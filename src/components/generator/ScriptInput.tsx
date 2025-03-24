
import React, { useState } from "react";
import { ScriptOption } from "@/types";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { translateScript } from "@/lib/api";

interface ScriptInputProps {
  scriptOption: ScriptOption;
  topic: string;
  onTopicChange: (topic: string) => void;
  customScript: string;
  onCustomScriptChange: (script: string) => void;
  onSearchWebChange?: (searchWeb: boolean) => void;
}

const commonLanguages = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese", label: "Chinese" },
  { value: "Russian", label: "Russian" },
  { value: "Arabic", label: "Arabic" },
  { value: "Hindi", label: "Hindi" },
];

const ScriptInput: React.FC<ScriptInputProps> = ({
  scriptOption,
  topic,
  onTopicChange,
  customScript,
  onCustomScriptChange,
  onSearchWebChange = () => {},
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");

  const handleSaveEdit = () => {
    if (scriptOption === ScriptOption.GPT) {
      onTopicChange(editedScript);
    } else {
      onCustomScriptChange(editedScript);
    }
    setIsEditing(false);
    toast.success("Script updated successfully");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedScript("");
  };

  const startEditing = () => {
    const currentScript = scriptOption === ScriptOption.GPT ? topic : customScript;
    setEditedScript(currentScript);
    setIsEditing(true);
  };

  const handleTranslateScript = async () => {
    if (targetLanguage === "English") {
      return; // No need to translate if already in English
    }

    const currentScript = scriptOption === ScriptOption.GPT ? topic : customScript;
    if (!currentScript.trim()) {
      toast.error("Please generate or enter a script first");
      return;
    }

    setIsTranslating(true);
    try {
      const translatedText = await translateScript(currentScript, targetLanguage);
      
      if (scriptOption === ScriptOption.GPT) {
        onTopicChange(translatedText);
      } else {
        onCustomScriptChange(translatedText);
      }
      
      toast.success(`Successfully translated to ${targetLanguage}`);
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Failed to translate script");
    } finally {
      setIsTranslating(false);
    }
  };

  // Automatically search the web for AI-generated scripts
  React.useEffect(() => {
    if (scriptOption === ScriptOption.GPT) {
      onSearchWebChange(true);
    }
  }, [scriptOption, onSearchWebChange]);

  return (
    <div className="space-y-4">
      {scriptOption === ScriptOption.GPT && (
        <motion.div 
          className="form-transition space-y-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-200">Topic/Keyword</label>
              <div className="flex items-center space-x-2">
                <Select value={targetLanguage} onValueChange={(value) => {
                  setTargetLanguage(value);
                  if (value !== "English" && topic.trim()) {
                    handleTranslateScript();
                  }
                }}>
                  <SelectTrigger className="h-8 w-[140px] bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    {commonLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="E.g., Benefits of meditation"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
            />
          </div>
          
          {topic && !isEditing && (
            <div className="p-4 bg-zinc-800 rounded-md border border-zinc-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-200">Generated Script</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="h-8 px-2 text-xs border-zinc-700 hover:bg-zinc-700"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{topic}</p>
            </div>
          )}
          
          {isEditing && (
            <div className="space-y-3">
              <label htmlFor="editScript" className="block text-sm font-medium text-gray-200">Edit Script</label>
              <Textarea
                id="editScript"
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="border-zinc-700 hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="bg-quicktok-orange hover:bg-quicktok-orange/90"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {scriptOption === ScriptOption.CUSTOM && (
        <motion.div 
          className="form-transition space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="customScript" className="block text-sm font-medium text-gray-200">Your Script</label>
            <Select value={targetLanguage} onValueChange={(value) => {
              setTargetLanguage(value);
              if (value !== "English" && customScript.trim()) {
                handleTranslateScript();
              }
            }}>
              <SelectTrigger className="h-8 w-[140px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {commonLanguages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            id="customScript"
            value={customScript}
            onChange={(e) => onCustomScriptChange(e.target.value)}
            rows={4}
            placeholder="Enter your script here..."
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
          />
        </motion.div>
      )}
    </div>
  );
};

export default ScriptInput;
