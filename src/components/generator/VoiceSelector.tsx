
import React from "react";
import { VoiceOption } from "@/types";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Find current voice name for display
  const currentVoice = voiceOptions.find(voice => voice.id === voiceId);
  const displayName = currentVoice ? 
    `${currentVoice.name}${currentVoice.description ? ` - ${currentVoice.description}` : ''}` : 
    "Select a voice";

  return (
    <div className="space-y-2">
      <label htmlFor="voiceId" className="block text-sm font-medium text-gray-200">Select Voice</label>
      <div className="relative">
        <select
          id="voiceId"
          value={voiceId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50 focus:border-quicktok-orange"
        >
          {voiceOptions.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}{voice.description ? ` - ${voice.description}` : ''}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
          <ChevronsUpDown size={18} />
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;
