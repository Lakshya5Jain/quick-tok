
import React from "react";
import { ScriptOption } from "@/types";

interface ScriptOptionSelectorProps {
  scriptOption: ScriptOption;
  onChange: (option: ScriptOption) => void;
}

const ScriptOptionSelector: React.FC<ScriptOptionSelectorProps> = ({ 
  scriptOption, 
  onChange 
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-200">Script Option</label>
      <div className="flex gap-4">
        <div className="flex items-center">
          <input
            type="radio"
            id="gpt"
            className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
            checked={scriptOption === ScriptOption.GPT}
            onChange={() => onChange(ScriptOption.GPT)}
          />
          <label htmlFor="gpt" className="ml-2 text-sm text-gray-300">Generate with AI</label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id="custom"
            className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
            checked={scriptOption === ScriptOption.CUSTOM}
            onChange={() => onChange(ScriptOption.CUSTOM)}
          />
          <label htmlFor="custom" className="ml-2 text-sm text-gray-300">Use my own script</label>
        </div>
      </div>
    </div>
  );
};

export default ScriptOptionSelector;
