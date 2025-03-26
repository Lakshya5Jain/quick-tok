
import React from "react";
import { Video } from "@/types";
import VideoCard from "./VideoCard";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import AdminStats from "./AdminStats";

interface VideoFeedProps {
  videos: Video[];
  isLoading?: boolean;
  stats?: {
    total_users: number;
    total_videos: number;
    updated_at: string;
  } | null;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ videos, isLoading = false, stats }) => {
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

  return (
    <div className="space-y-6">
      {stats && <AdminStats stats={stats} />}
      
      {(!videos || videos.length === 0) ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
