import React, { useState, useEffect } from "react";
import { ScriptOption, VoiceOption } from "@/types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ScriptOptionSelector from "./generator/ScriptOptionSelector";
import ScriptInput from "./generator/ScriptInput";
import MediaInput from "./generator/MediaInput";
import VoiceSelector from "./generator/VoiceSelector";
import SubmitButton from "./generator/SubmitButton";
import TikTokPreview from "./generator/TikTokPreview";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown } from "lucide-react";

interface GeneratorFormProps {
  onSubmit: (formData: {
    scriptOption: ScriptOption;
    topic?: string;
    customScript?: string;
    supportingMedia?: string;
    supportingMediaFile?: File;
    voiceId: string;
    voiceMedia?: string;
    voiceMediaFile?: File;
    highResolution: boolean;
    vibes: string;
    language: string;
  }) => void;
  isSubmitting: boolean;
  voiceOptions: VoiceOption[];
}

const GeneratorForm: React.FC<GeneratorFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  voiceOptions 
}) => {
  // Default supporting media URL
  const defaultSupportingMedia = "https://i.makeagif.com/media/11-27-2023/Uii6jU.mp4";

  const [scriptOption, setScriptOption] = useState<ScriptOption>(ScriptOption.GPT);
  const [topic, setTopic] = useState("");
  const [customScript, setCustomScript] = useState("");
  const [supportingMedia, setSupportingMedia] = useState("");
  const [supportingMediaFile, setSupportingMediaFile] = useState<File | null>(null);
  const [useMediaFile, setUseMediaFile] = useState(false);
  const [voiceId, setVoiceId] = useState("LXVY607YcjqxFS3mcult");
  const [voiceMedia, setVoiceMedia] = useState("");
  const [voiceMediaFile, setVoiceMediaFile] = useState<File | null>(null);
  const [useVoiceMediaFile, setUseVoiceMediaFile] = useState(false);
  const [highResolution] = useState(true);
  const [vibes, setVibes] = useState<string>("funny");
  const [language, setLanguage] = useState<string>("English");

  // Preview state
  const [previewVoiceMedia, setPreviewVoiceMedia] = useState<string | null>(null);
  const [previewSupportingMedia, setPreviewSupportingMedia] = useState<string | null>(null);
  
  // Get current script based on selected option
  const currentScript = scriptOption === ScriptOption.GPT 
    ? topic 
    : scriptOption === ScriptOption.CUSTOM 
      ? customScript 
      : "";

  // Character images for voice character media
  const characterImages = [
    "https://pbs.twimg.com/media/ElHEwVHXUAEtiwR.jpg",
    "https://images.jacobinmag.com/wp-content/uploads/2019/08/08095230/Bernie_Sanders_Joe_Rogan_c0-0-1361-794_s1770x1032.jpg",
    "https://media.newyorker.com/photos/630e85c820c2208e4152741d/3:2/w_2559,h_1706,c_limit/Cassidy-Biden-Month.jpg",
    "https://i.abcnewsfe.com/a/030dec16-260c-4be0-8fe6-28b41c06bb36/donald-trump-9-gty-gmh-250313_1741885130014_hpMain.jpg",
    "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/3E0B/production/_109238851_lebron.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4a/Alexandria_Ocasio-Cortez_Official_Portrait.jpg",
    "https://platform.vox.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/23966471/Screen_Shot_2022_08_23_at_4.22.21_PM.png?quality=90&strip=all&crop=11.536561264822,0,76.926877470356,100",
    "https://www.hollywoodreporter.com/wp-content/uploads/2024/03/Syndey-Sweeney-SNL-screenshot-H-2024.jpg?w=1296&h=730&crop=1",
    "https://image.cnbcfm.com/api/v1/image/107293744-1693398435735-elon.jpg?v=1738327797",
    "https://www.uc.edu/news/articles/2019/06/n20837546/jcr:content/image.img.cq5dam.thumbnail.500.500.jpg/1564681743976.jpg"
  ];

  // Supporting media options (videos and logo)
  const supportingMediaOptions = [
    "https://cdn.revid.ai/backgrounds/satisfying/crush_low.mp4",
    "https://cdn.revid.ai/subway_surfers/LOW_RES/4.mp4",
    "https://cdn.revid.ai/backgrounds/minecraft/orbit_low.mp4",
    "https://cdn.revid.ai/backgrounds/fortnite/video_lowres_2.mp4",
    "https://cdn.pixabay.com/video/2024/12/04/244839_large.mp4",
    "https://cdn.pixabay.com/video/2023/05/20/163869-828669760_large.mp4",
    "https://cdn.pixabay.com/video/2017/01/14/7340-199627481_tiny.mp4",
    "https://cdn.revid.ai/backgrounds/space/video_lowres_5.mp4",
    "https://cdn.dbolical.com/cache/videos/mods/1/28/27348/encode720p_mp4/gta-v-mod-realistic-motorcycles-preview.mp4",
    "https://www.quick-tok.com/lovable-uploads/e1854fe7-b207-42fc-8841-a35599adc678.png"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (scriptOption === ScriptOption.GPT && !topic.trim()) {
      toast.error("Please enter a topic for AI script generation");
      return;
    }
    
    if (scriptOption === ScriptOption.CUSTOM && !customScript.trim()) {
      toast.error("Please enter your custom script");
      return;
    }

    if (useMediaFile && !supportingMediaFile) {
      toast.error("Please upload a supporting media file or switch to URL input");
      return;
    }

    if (!useMediaFile && supportingMedia.trim() && !isValidUrl(supportingMedia)) {
      toast.error("Please enter a valid URL for supporting media");
      return;
    }

    if (useVoiceMediaFile && !voiceMediaFile) {
      toast.error("Please upload a voice character image or switch to URL input");
      return;
    }

    if (!useVoiceMediaFile && voiceMedia.trim() && !isValidUrl(voiceMedia)) {
      toast.error("Please enter a valid URL for voice character media");
      return;
    }
    
    onSubmit({
      scriptOption,
      topic: scriptOption === ScriptOption.GPT ? topic : undefined,
      customScript: scriptOption === ScriptOption.CUSTOM ? customScript : undefined,
      supportingMedia: !useMediaFile ? supportingMedia : undefined,
      supportingMediaFile: useMediaFile ? supportingMediaFile || undefined : undefined,
      voiceId,
      voiceMedia: !useVoiceMediaFile ? voiceMedia : undefined,
      voiceMediaFile: useVoiceMediaFile ? voiceMediaFile || undefined : undefined,
      highResolution,
      vibes,
      language,
    });
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      {/* Form Section */}
      <motion.div 
        className="flex-1 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Create TikTok Video</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Script Option Selection */}
          <ScriptOptionSelector 
            scriptOption={scriptOption} 
            onChange={setScriptOption}
          />
          
          {/* Script Input based on selection */}
          <ScriptInput 
            scriptOption={scriptOption}
            topic={topic}
            onTopicChange={setTopic}
            customScript={customScript}
            onCustomScriptChange={setCustomScript}
          />
          
          {/* Vibes & Language Selectors (only show for GPT option) */}
          {scriptOption === ScriptOption.GPT && (
            <div className="grid grid-cols-2 gap-4">
              {/* Video Vibes Selector */}
              <div className="space-y-2">
                <label htmlFor="vibes" className="block text-sm font-medium text-gray-200">Vibes</label>
                <div className="relative">
                  <select
                    id="vibes"
                    value={vibes}
                    onChange={(e) => setVibes(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50 focus:border-quicktok-orange"
                  >
                    <option value="funny">Funny / Meme</option>
                    <option value="story">Storytime</option>
                    <option value="educational">Quick Facts</option>
                    <option value="serious">Serious</option>
                    <option value="motivational">Hype</option>
                    <option value="shock">Mind-Blowing</option>
                    <option value="chill">Aesthetic / Chill</option>
                    <option value="rant">Hot Take</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                    <ChevronsUpDown size={18} />
                  </div>
                </div>
              </div>

              {/* Language Selector */}
              <div className="space-y-2">
                <label htmlFor="language" className="block text-sm font-medium text-gray-200">Language</label>
                <div className="relative">
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50 focus:border-quicktok-orange"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Italian">Italian</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Mandarin Chinese">Mandarin Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Russian">Russian</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                    <ChevronsUpDown size={18} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Voice Selection */}
          <VoiceSelector 
            voiceId={voiceId}
            onChange={setVoiceId}
            voiceOptions={voiceOptions}
          />
          
          {/* Voice Character Media Input */}
          <MediaInput 
            title="Voice Character Media"
            description="This image will be transformed into a talking video. For best results, upload or pick a clear photo of a person's face."
            useFile={useVoiceMediaFile}
            onToggleUseFile={setUseVoiceMediaFile}
            url={voiceMedia}
            onUrlChange={setVoiceMedia}
            onFileChange={setVoiceMediaFile}
            urlPlaceholder="Enter URL for voice character image"
            fileAccept="image/jpeg,image/jpg,image/png"
            selectedFile={voiceMediaFile}
            onMediaAvailable={(isAvailable, mediaUrl) => setPreviewVoiceMedia(mediaUrl)}
            tabOptions={characterImages}
            tabLabel="Choose Character"
          />
          
          {/* Supporting Media Input */}
          <MediaInput 
            title="Supporting Media"
            description="Video/image shown at the bottom of your short video."
            useFile={useMediaFile}
            onToggleUseFile={setUseMediaFile}
            url={supportingMedia}
            onUrlChange={setSupportingMedia}
            onFileChange={setSupportingMediaFile}
            urlPlaceholder="Enter URL for supporting media"
            fileAccept="image/jpeg,image/jpg,image/png,video/mp4"
            selectedFile={supportingMediaFile}
            onMediaAvailable={(isAvailable, mediaUrl) => setPreviewSupportingMedia(mediaUrl)}
            tabOptions={supportingMediaOptions}
            tabLabel="Choose Media"
          />
          
          {/* Submit Button */}
          <SubmitButton 
            isSubmitting={isSubmitting} 
            label="Generate Video"
            submittingLabel="Generating..."
          />
        </form>
      </motion.div>
      
      {/* Preview Section */}
      <motion.div
        className="w-full md:w-96 p-8 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Preview</h2>
        
        <TikTokPreview
          voiceMedia={previewVoiceMedia}
          supportingMedia={previewSupportingMedia}
          script={currentScript}
        />
        
        <p className="text-gray-400 text-sm mt-6 text-center">
          This is a preview of how your TikTok will look. The actual generated video will include animation and narration.
        </p>
        
        <p className="text-gray-500 text-xs mt-4 text-center">
          Powered by Creatomate & Lemon Slice
        </p>
      </motion.div>
    </div>
  );
};

export default GeneratorForm;
