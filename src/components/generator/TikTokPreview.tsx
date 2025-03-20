
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
        {/* Top section - Voice Character */}
        <div className="flex-1 overflow-hidden relative">
          {voiceMediaSrc && (
            <img 
              src={voiceMediaSrc} 
              alt="Voice character" 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Caption overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white text-sm font-medium"
            >
              {script ? script.substring(0, 80) + (script.length > 80 ? "..." : "") : "Your script will appear here..."}
            </motion.div>
          </div>
        </div>
        
        {/* Bottom section - Supporting Media */}
        {supportingMedia && (
          <div className="h-1/3 overflow-hidden">
            {supportingMedia.includes("video") ? (
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
            )}
          </div>
        )}
        
        {/* TikTok Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex gap-1 text-xs text-white">
          <div className="flex items-center">
            <span className="bg-black/50 px-2 py-1 rounded-full">0:16</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokPreview;
