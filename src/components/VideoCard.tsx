
import React from "react";
import { Video } from "@/types";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Download, Share } from "lucide-react";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const downloadVideo = () => {
    const link = document.createElement('a');
    link.href = video.finalVideoUrl;
    link.download = `quick-tok-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareVideo = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Quick-Tok Video',
        text: 'Check out this video I created with Quick-Tok!',
        url: video.finalVideoUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    }
  };

  return (
    <motion.div 
      className="mb-8 overflow-hidden bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="video-player border-b border-zinc-800">
        <div className="relative aspect-[9/16] max-w-[280px] mx-auto overflow-hidden">
          <video 
            controls 
            playsInline 
            className="absolute inset-0 w-full h-full object-contain bg-black"
          >
            <source src={video.finalVideoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      <div className="p-6 space-y-3">
        <h3 className="text-lg font-medium text-gray-200">Video Script</h3>
        <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300">
          {video.scriptText}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            Created on: {formatDate(video.timestamp)}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                downloadVideo();
              }}
              className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            {navigator.share && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  shareVideo();
                }}
                className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors"
                aria-label="Share"
              >
                <Share className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
