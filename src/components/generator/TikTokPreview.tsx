
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TikTokPreviewProps {
  voiceMedia: string | null;
  supportingMedia: string | null;
  script: string;
}

const TikTokPreview: React.FC<TikTokPreviewProps> = ({
  voiceMedia,
  supportingMedia,
  script
}) => {
  const defaultVoiceMedia = "https://6ammc3n5zzf5ljnz.public.blob.vercel-storage.com/inf2-image-uploads/image_8132d-DYy5ZM9i939tkiyw6ADf3oVyn6LivZ.png";
  const defaultSupportingMedia = "https://i.makeagif.com/media/11-27-2023/Uii6jU.mp4";
  
  const [supportingMediaError, setSupportingMediaError] = useState(false);
  
  // Use the default image if no voice media provided
  const voiceMediaSrc = voiceMedia || defaultVoiceMedia;
  
  // Use the default supporting media if none provided or if there was an error
  const supportingMediaSrc = (supportingMedia && !supportingMediaError) ? supportingMedia : defaultSupportingMedia;
  
  // Reset error state when supportingMedia changes
  useEffect(() => {
    setSupportingMediaError(false);
  }, [supportingMedia]);
  
  const handleMediaError = () => {
    console.error("Error loading supporting media:", supportingMedia);
    setSupportingMediaError(true);
  };
  
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-lg mx-auto">
      <div className="relative aspect-[9/16] w-full max-w-[320px] bg-black flex flex-col">
        {/* Top section - Voice Character (exactly 1/2 of height) */}
        <div className="flex-grow-0 h-1/2 overflow-hidden relative">
          {voiceMediaSrc && (
            <img 
              src={voiceMediaSrc} 
              alt="Voice character" 
              className="w-full h-full object-cover"
              onError={() => console.log("Voice media failed to load, using default")}
            />
          )}
        </div>
        
        {/* Bottom section - Supporting Media (exactly 1/2 of height) */}
        <div className="flex-grow-0 h-1/2 overflow-hidden bg-zinc-800">
          {supportingMediaSrc ? (
            supportingMediaSrc.includes("video") || supportingMediaSrc.includes(".mp4") ? (
              <video 
                src={supportingMediaSrc} 
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                onError={handleMediaError}
              />
            ) : (
              <img 
                src={supportingMediaSrc} 
                alt="Supporting media" 
                className="w-full h-full object-cover"
                onError={handleMediaError}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              Supporting media will appear here
            </div>
          )}
        </div>
        
        {/* Script overlay in the middle - improved styling */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white px-4 py-2 rounded-lg max-w-[85%] text-center shadow-lg"
          >
            <p className="text-black text-sm font-bold">
              {script ? script.substring(0, 80) + (script.length > 80 ? "..." : "") : "Your script will appear here..."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TikTokPreview;
