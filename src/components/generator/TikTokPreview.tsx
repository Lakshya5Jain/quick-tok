
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

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
  
  const [voiceMediaError, setVoiceMediaError] = useState(false);
  const [supportingMediaError, setSupportingMediaError] = useState(false);
  const [supportingMediaType, setSupportingMediaType] = useState<'video' | 'image' | null>(null);
  const [isVoiceMediaLoading, setIsVoiceMediaLoading] = useState(true);
  const [isSupportingMediaLoading, setIsSupportingMediaLoading] = useState(true);
  
  // Reset loading state when media URLs change
  useEffect(() => {
    if (voiceMedia) {
      setIsVoiceMediaLoading(true);
      setVoiceMediaError(false);
    }
    
    if (supportingMedia) {
      setIsSupportingMediaLoading(true);
      setSupportingMediaError(false);
    }
  }, [voiceMedia, supportingMedia]);
  
  // Determine if the supporting media is a video or image
  useEffect(() => {
    if (supportingMedia) {
      const isVideo = 
        supportingMedia.includes("video") || 
        supportingMedia.includes(".mp4") || 
        supportingMedia.includes(".mov") || 
        supportingMedia.includes(".webm") ||
        supportingMedia.includes(".avi");
      setSupportingMediaType(isVideo ? 'video' : 'image');
    } else {
      // Default supporting media is a video
      setSupportingMediaType('video');
    }
  }, [supportingMedia]);
  
  // Use the default image if no voice media provided or on error
  const voiceMediaSrc = (!voiceMedia || voiceMediaError) ? defaultVoiceMedia : voiceMedia;
  
  // Use the default supporting media if none provided or on error
  const supportingMediaSrc = (!supportingMedia || supportingMediaError) ? defaultSupportingMedia : supportingMedia;
  
  const handleVoiceMediaLoad = () => {
    setIsVoiceMediaLoading(false);
  };
  
  const handleVoiceMediaError = () => {
    setVoiceMediaError(true);
    setIsVoiceMediaLoading(false);
    console.log("Error loading voice media, falling back to default");
  };
  
  const handleSupportingMediaLoad = () => {
    setIsSupportingMediaLoading(false);
  };
  
  const handleSupportingMediaError = () => {
    setSupportingMediaError(true);
    setIsSupportingMediaLoading(false);
    console.log("Error loading supporting media, falling back to default");
  };
  
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-lg mx-auto">
      <div className="relative aspect-[9/16] w-full max-w-[320px] bg-black flex flex-col">
        {/* Top section - Voice Character (exactly 1/2 of height) */}
        <div className="flex-grow-0 h-1/2 overflow-hidden relative">
          {isVoiceMediaLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
              <Loader2 className="w-8 h-8 text-quicktok-orange animate-spin" />
            </div>
          )}
          <img 
            src={voiceMediaSrc} 
            alt="Voice character" 
            className="w-full h-full object-cover"
            onLoad={handleVoiceMediaLoad}
            onError={handleVoiceMediaError}
            style={{ display: isVoiceMediaLoading ? 'none' : 'block' }}
          />
        </div>
        
        {/* Bottom section - Supporting Media (exactly 1/2 of height) */}
        <div className="flex-grow-0 h-1/2 overflow-hidden bg-zinc-800 relative">
          {isSupportingMediaLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
              <Loader2 className="w-8 h-8 text-quicktok-orange animate-spin" />
            </div>
          )}
          
          {supportingMediaSrc ? (
            supportingMediaType === 'video' ? (
              <video 
                src={supportingMediaSrc} 
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                onLoadedData={handleSupportingMediaLoad}
                onError={handleSupportingMediaError}
                style={{ display: isSupportingMediaLoading ? 'none' : 'block' }}
              />
            ) : (
              <img 
                src={supportingMediaSrc} 
                alt="Supporting media" 
                className="w-full h-full object-cover"
                onLoad={handleSupportingMediaLoad}
                onError={handleSupportingMediaError}
                style={{ display: isSupportingMediaLoading ? 'none' : 'block' }}
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
