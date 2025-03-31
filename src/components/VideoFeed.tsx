
import React from "react";
import { motion } from "framer-motion";
import { Video } from "@/types";
import VideoCard from "./VideoCard";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoFeedProps {
  videos: Video[];
  onVideoClick?: (video: Video) => void;
  isLoading?: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ 
  videos, 
  onVideoClick,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-full bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <Skeleton className="h-32 w-full mb-4 bg-zinc-800" />
            <Skeleton className="h-6 w-3/4 mb-2 bg-zinc-800" />
            <Skeleton className="h-4 w-1/2 bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold text-gray-300">No videos yet</h3>
        <p className="text-gray-400 mt-2">Create your first TikTok-style video now!</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      className="grid grid-cols-1 gap-6 w-full"
    >
      {videos.map((video) => (
        <VideoCard 
          key={video.id} 
          video={video} 
          onClick={() => onVideoClick && onVideoClick(video)}
        />
      ))}
    </motion.div>
  );
};

export default VideoFeed;
