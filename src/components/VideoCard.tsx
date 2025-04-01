
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
  const downloadVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = video.finalVideoUrl;
    link.download = `quick-tok-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    }
  };

  return (
    <motion.div 
      className="overflow-hidden bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-zinc-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex flex-col md:flex-row">
        <div className="video-player border-b md:border-b-0 md:border-r border-zinc-800 p-3">
          <div className="relative aspect-[9/16] w-full max-w-[230px] mx-auto overflow-hidden rounded-lg">
            <video 
              controls 
              playsInline 
              className="absolute inset-0 w-full h-full object-contain bg-black"
              poster={`${video.finalVideoUrl}?poster=true`}
            >
              <source src={video.finalVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-200">Video Script</h3>
            <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300 max-h-[150px] overflow-y-auto">
              {video.scriptText.length > 200 
                ? `${video.scriptText.substring(0, 200)}...` 
                : video.scriptText}
            </div>
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-gray-500">
              Created on: {formatDate(video.timestamp)}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={downloadVideo}
                className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors"
                aria-label="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              {navigator.share && (
                <button 
                  onClick={shareVideo}
                  className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors"
                  aria-label="Share"
                >
                  <Share className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
