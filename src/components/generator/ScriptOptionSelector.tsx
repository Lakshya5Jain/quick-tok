
import React from "react";
import { ScriptOption } from "@/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
      <ToggleGroup 
        type="single" 
        value={scriptOption} 
        onValueChange={(value) => value && onChange(value as ScriptOption)}
        className="bg-zinc-800 p-1 rounded-lg w-full flex"
      >
        <ToggleGroupItem 
          value={ScriptOption.GPT} 
          aria-label="Generate with AI"
          className="flex-1 rounded-md data-[state=on]:bg-quicktok-orange data-[state=on]:text-white"
        >
          Generate with AI
        </ToggleGroupItem>
        <ToggleGroupItem 
          value={ScriptOption.CUSTOM} 
          aria-label="Use my own script"
          className="flex-1 rounded-md data-[state=on]:bg-quicktok-orange data-[state=on]:text-white"
        >
          Use my own script
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ScriptOptionSelector;
