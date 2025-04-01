
import React from "react";
import { motion } from "framer-motion";
import { Video } from "@/types";
import VideoCard from "./VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "lucide-react";

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
      <div className="w-full max-w-3xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div 
            key={i} 
            className="w-full bg-zinc-900 rounded-xl p-5 border border-zinc-800 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-48 w-32 bg-zinc-800 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4 bg-zinc-800" />
                <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                <Skeleton className="h-24 w-full bg-zinc-800 mt-2 rounded-md" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <motion.div 
        className="text-center py-16 px-8 bg-zinc-900/70 rounded-xl border border-zinc-800 backdrop-blur-sm max-w-3xl mx-auto shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className="w-24 h-24 mx-auto mb-6 opacity-30 bg-gradient-to-br from-zinc-700 to-zinc-800 p-6 rounded-full">
            <Film className="w-full h-full text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-200 mb-3">No videos yet</h3>
          <p className="text-gray-400 mb-6">Create your first TikTok-style video by switching to the Create tab.</p>
          <div className="h-1 w-20 bg-quicktok-orange/50 mx-auto rounded-full" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-200 mb-6">Your Videos</h2>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-12"
      >
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <VideoCard 
              video={video} 
              onClick={() => onVideoClick && onVideoClick(video)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default VideoFeed;
