
import React from "react";
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

  return (
    <motion.div 
      className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-zinc-700 overflow-hidden"
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex flex-col md:flex-row">
        <div className="video-container border-b md:border-b-0 md:border-r border-zinc-800 p-4 flex justify-center items-center">
          <div className="relative aspect-[9/16] w-full max-w-[160px] overflow-hidden rounded-lg shadow-md">
            <video 
              className="absolute inset-0 w-full h-full object-cover bg-black"
              poster={`${video.finalVideoUrl}?poster=true`}
              onClick={(e) => {
                e.stopPropagation();
                const videoEl = e.currentTarget;
                if (videoEl.paused) {
                  videoEl.play();
                } else {
                  videoEl.pause();
                }
              }}
            >
              <source src={video.finalVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-200">Video Script</h3>
            <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {video.scriptText.length > 250 
                ? `${video.scriptText.substring(0, 250)}...` 
                : video.scriptText}
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
