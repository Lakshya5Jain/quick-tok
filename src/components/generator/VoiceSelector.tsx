
import React from "react";
import { VoiceOption } from "@/types";

interface VoiceSelectorProps {
  voiceId: string;
  onChange: (voiceId: string) => void;
  voiceOptions: VoiceOption[];
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voiceId,
  onChange,
  voiceOptions
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="voiceId" className="block text-sm font-medium text-gray-200">Select Voice</label>
      <select
        id="voiceId"
        value={voiceId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
      >
        {voiceOptions.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}{voice.description ? ` - ${voice.description}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector;
