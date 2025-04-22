import React from "react";
import { Video } from "@/types";
import VideoCard from "./VideoCard";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface VideoFeedProps {
  videos: Video[];
}

const VideoFeed: React.FC<VideoFeedProps> = ({ videos }) => {
  if (videos.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-[50vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-16 h-16 bg-quicktok-orange/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-quicktok-orange" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
        <p className="text-gray-400 text-center max-w-md">
          Create your first video using the Create tab to see it appear here
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <VideoCard video={video} />
        </motion.div>
      ))}
    </div>
  );
};

export default VideoFeed;
