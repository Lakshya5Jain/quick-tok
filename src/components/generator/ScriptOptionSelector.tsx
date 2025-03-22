
import React from "react";
import { ScriptOption } from "@/types";
import { motion } from "framer-motion";
import { Lightbulb, Edit } from "lucide-react";

interface ScriptOptionSelectorProps {
  scriptOption: ScriptOption;
  onChange: (option: ScriptOption) => void;
}

const ScriptOptionSelector: React.FC<ScriptOptionSelectorProps> = ({ 
  scriptOption, 
  onChange 
}) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-300">Choose your script source:</p>
      
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          type="button"
          className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
            scriptOption === ScriptOption.GPT
              ? "bg-quicktok-orange text-white border-quicktok-orange"
              : "bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-zinc-700"
          }`}
          onClick={() => onChange(ScriptOption.GPT)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Lightbulb className="mb-2 h-5 w-5" />
          <span className="font-medium">AI Generated</span>
          <span className="text-xs mt-1 text-center">Create script from a topic</span>
        </motion.button>
        
        <motion.button
          type="button"
          className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
            scriptOption === ScriptOption.CUSTOM
              ? "bg-quicktok-orange text-white border-quicktok-orange"
              : "bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-zinc-700"
          }`}
          onClick={() => onChange(ScriptOption.CUSTOM)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Edit className="mb-2 h-5 w-5" />
          <span className="font-medium">Custom Script</span>
          <span className="text-xs mt-1 text-center">Write your own script</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ScriptOptionSelector;
