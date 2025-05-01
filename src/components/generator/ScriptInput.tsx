import React, { useState, useEffect } from "react";
import { ScriptOption } from "@/types";
import { motion } from "framer-motion";

interface ScriptInputProps {
  scriptOption: ScriptOption;
  topic: string;
  onTopicChange: (topic: string) => void;
  customScript: string;
  onCustomScriptChange: (script: string) => void;
}

const ScriptInput: React.FC<ScriptInputProps> = ({
  scriptOption,
  topic,
  onTopicChange,
  customScript,
  onCustomScriptChange
}) => {
  // Add cycling placeholder logic
  const examplePlaceholders = [
    "A funny math joke",
    "A short presentation on climate change",
    "Tips for staying productive",
    "A quick recipe for breakfast",
    "How to train your dog"
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  // Maximum words allowed in custom script
  const MAX_WORDS = 1000;
  // Track current word count for custom script
  const [wordCount, setWordCount] = useState<number>(0);

  // Utility to count words reliably
  const countWords = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  // Keep wordCount in sync with external customScript value (e.g., when resetting form)
  useEffect(() => {
    setWordCount(countWords(customScript));
  }, [customScript]);

  useEffect(() => {
    if (topic) return; // Don't cycle if user is typing
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % examplePlaceholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [topic]);

  return (
    <>
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
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder={topic ? undefined : `E.g., ${examplePlaceholders[placeholderIndex]}`}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
          />
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
          <div className="relative">
            <textarea
              id="customScript"
              value={customScript}
              onChange={(e) => {
                const text = e.target.value;
                const count = countWords(text);
                if (count <= MAX_WORDS) {
                  onCustomScriptChange(text);
                  setWordCount(count);
                } else {
                  // If limit exceeded, keep only first MAX_WORDS words
                  const truncated = text.trim().split(/\s+/).slice(0, MAX_WORDS).join(" ");
                  onCustomScriptChange(truncated);
                  setWordCount(MAX_WORDS);
                }
              }}
              rows={6}
              placeholder="Enter your script here..."
              className="w-full px-4 py-2 pb-8 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50 resize-y"
            />
            <span className="absolute right-3 bottom-2 text-xs text-gray-400 select-none">
              {wordCount}/{MAX_WORDS}
            </span>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ScriptInput;
