
import React from "react";
import { Video } from "@/types";
import VideoCard from "./VideoCard";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";

interface VideoFeedProps {
  videos: Video[];
  isLoading?: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ videos, isLoading = false }) => {
  if (isLoading) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Loader className="w-8 h-8 text-quicktok-orange animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your videos...</p>
      </motion.div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-muted-foreground mb-2">No videos generated yet</p>
        <p className="text-sm text-center max-w-md">
          Create your first video using the Generate Video tab to see it here
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

export default VideoFeed;
