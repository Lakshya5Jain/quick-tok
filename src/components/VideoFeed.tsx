
import React from "react";
import { motion } from "framer-motion";
import { Video } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import VideoCard from "./VideoCard";

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
      <div className="container mx-auto grid gap-6 py-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900/90 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <Skeleton className="h-48 w-32 min-w-32 bg-zinc-800 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                  <Skeleton className="h-24 w-full bg-zinc-800 mt-2 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <motion.div 
          className="text-center py-16 px-8 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 opacity-40 bg-gradient-to-br from-zinc-700 to-zinc-800 p-5 rounded-full">
            <Film className="w-full h-full text-gray-300" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-200 mb-3">No videos yet</h3>
          <p className="text-gray-400 mb-6">Create your first TikTok-style video by switching to the Create tab.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6">
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
      </div>
    </div>
  );
};

export default VideoFeed;
