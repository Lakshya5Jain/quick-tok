
import React from "react";
import { Video } from "@/types";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  return (
    <motion.div 
      className="app-card mb-8 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="video-player mb-4">
        <video controls playsInline>
          <source src={video.finalVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Video Script</h3>
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
          {video.scriptText}
        </div>
        <div className="text-xs text-muted-foreground">
          Created on: {formatDate(video.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
