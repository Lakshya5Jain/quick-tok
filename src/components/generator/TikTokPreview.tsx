
import React from "react";
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
  
  // Use the default image if no voice media provided
  const voiceMediaSrc = voiceMedia || defaultVoiceMedia;
  
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-lg mx-auto max-w-[320px]">
      <div className="relative aspect-[9/16] bg-black flex flex-col">
        {/* Top section - Voice Character (1/2 of height) */}
        <div className="flex-grow-0 h-1/2 overflow-hidden relative">
          {voiceMediaSrc && (
            <img 
              src={voiceMediaSrc} 
              alt="Voice character" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Bottom section - Supporting Media (1/2 of height) */}
        <div className="flex-grow-0 h-1/2 overflow-hidden bg-zinc-800">
          {supportingMedia ? (
            supportingMedia.includes("video") ? (
              <video 
                src={supportingMedia} 
                className="w-full h-full object-cover"
                muted
                loop
              />
            ) : (
              <img 
                src={supportingMedia} 
                alt="Supporting media" 
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              Supporting media will appear here
            </div>
          )}
        </div>
        
        {/* Script overlay in the middle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg max-w-[90%] text-center"
          >
            <p className="text-white text-sm font-medium">
              {script ? script.substring(0, 80) + (script.length > 80 ? "..." : "") : "Your script will appear here..."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TikTokPreview;
