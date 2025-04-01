
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
      <div className="grid grid-cols-1 gap-6 w-full max-w-3xl mx-auto">
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
      <div className="text-center py-16 px-4 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No videos yet</h3>
          <p className="text-gray-400 mb-6">Create your first TikTok-style video now!</p>
          <div className="w-24 h-24 mx-auto opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="2" y1="7" x2="7" y2="7"></line>
              <line x1="2" y1="17" x2="7" y2="17"></line>
              <line x1="17" y1="17" x2="22" y2="17"></line>
              <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      className="grid grid-cols-1 gap-6 w-full max-w-3xl mx-auto pb-12"
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
