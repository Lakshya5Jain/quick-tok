
import React, { useState } from "react";
import { Video } from "@/types";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const downloadVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const link = document.createElement('a');
    link.href = video.finalVideoUrl;
    link.download = `quick-tok-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Download started!");
  };

  const shareVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: 'My Quick-Tok Video',
        text: 'Check out this video I created with Quick-Tok!',
        url: video.finalVideoUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      toast.info("Sharing not supported on this device");
    }
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.stopPropagation();
    const videoEl = e.currentTarget;
    
    if (videoEl.paused) {
      videoEl.play();
      setIsPlaying(true);
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  return (
    <motion.div 
      className="bg-zinc-900/90 rounded-xl border border-zinc-800 shadow-lg overflow-hidden"
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex flex-col md:flex-row">
        <div className="video-container md:border-r border-zinc-800 p-4 flex justify-center items-center">
          <div className="relative max-w-[240px] mx-auto w-full">
            <div className="aspect-[9/16] relative overflow-hidden rounded-lg shadow-md">
              <video 
                className="absolute inset-0 w-full h-full object-cover bg-black"
                poster={`${video.finalVideoUrl}?poster=true`}
                onClick={handleVideoClick}
              >
                <source src={video.finalVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <motion.div 
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-quicktok-orange/80 backdrop-blur-sm text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-200">Video Script</h3>
            <div className="p-4 bg-zinc-800/70 rounded-lg text-sm text-gray-300 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {video.scriptText}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 mt-2">
            <div className="text-xs text-gray-500">
              Created: {formatDate(video.timestamp)}
            </div>
            <div className="flex gap-2">
              <motion.button 
                onClick={downloadVideo}
                className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors"
                aria-label="Download"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="h-4 w-4" />
              </motion.button>
              
              {navigator.share && (
                <motion.button 
                  onClick={shareVideo}
                  className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors"
                  aria-label="Share"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
