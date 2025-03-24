
import React, { useState } from "react";
import { ScriptOption } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Languages } from "lucide-react";
import { translateScript } from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ScriptInputProps {
  scriptOption: ScriptOption;
  topic: string;
  onTopicChange: (topic: string) => void;
  customScript: string;
  onCustomScriptChange: (script: string) => void;
  searchWeb?: boolean;
  onSearchWebChange?: (searchWeb: boolean) => void;
}

const commonLanguages = [
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
  searchWeb = false,
  onSearchWebChange = () => {},
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("");

  const handleTranslateScript = async () => {
    if (!targetLanguage) {
      toast.error("Please select a language to translate to");
      return;
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
            <label htmlFor="topic" className="block text-sm font-medium text-gray-200">Topic/Keyword</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="E.g., Benefits of meditation"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="search-web" className="text-white">Search the web</Label>
              <p className="text-xs text-gray-400 mt-1">
                Enable to include real-time information
              </p>
            </div>
            <Switch
              id="search-web"
              checked={searchWeb}
              onCheckedChange={onSearchWebChange}
              className="data-[state=checked]:bg-quicktok-orange"
            />
          </div>
        </motion.div>
      )}
      
      {scriptOption === ScriptOption.CUSTOM && (
        <motion.div 
          className="form-transition space-y-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label htmlFor="customScript" className="block text-sm font-medium text-gray-200">Your Script</label>
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

      {/* Translation Section */}
      <div className="border-t border-zinc-700 pt-4 mt-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-end">
          <div className="w-full sm:w-2/3">
            <Label htmlFor="language-selector" className="text-sm font-medium text-gray-200 mb-2 block">
              Translate to another language
            </Label>
            <Select onValueChange={setTargetLanguage} value={targetLanguage}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select language" />
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
          <Button 
            type="button" 
            variant="outline" 
            className="w-full sm:w-1/3 border-zinc-700 hover:bg-quicktok-orange hover:text-white"
            onClick={handleTranslateScript}
            disabled={isTranslating}
          >
            <Languages className="w-4 h-4 mr-2" />
            {isTranslating ? "Translating..." : "Translate"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScriptInput;
