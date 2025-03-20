
import React from "react";
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
            placeholder="E.g., Benefits of meditation"
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
          <textarea
            id="customScript"
            value={customScript}
            onChange={(e) => onCustomScriptChange(e.target.value)}
            rows={4}
            placeholder="Enter your script here..."
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
          />
        </motion.div>
      )}
    </>
  );
};

export default ScriptInput;
