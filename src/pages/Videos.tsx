import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import VideoFeed from "@/components/VideoFeed";
import { getVideos } from "@/lib/api";
import { toast } from "sonner";
import { useCredits } from "@/context/CreditsContext";
import { Video } from "@/types";
import { motion } from "framer-motion";
import { VideoIcon } from "lucide-react";

const VideosPage: React.FC = () => {
  const navigate = useNavigate();
  const { subscription } = useCredits();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getVideos()
      .then((loaded) => setVideos(loaded))
      .catch((error) => {
        console.error("Failed to load videos:", error);
        toast.error("Failed to load videos");
        setHasError(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-7xl mx-auto pt-8">
        <Navbar activeTab="videos" onTabChange={() => navigate("/videos")} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-quicktok-orange/10 rounded-lg flex items-center justify-center">
              <VideoIcon className="w-6 h-6 text-quicktok-orange" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Videos</h1>
              <p className="text-gray-400">
                {videos.length} {videos.length === 1 ? 'video' : 'videos'} created
              </p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-quicktok-orange/20 border-t-quicktok-orange rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Loading your videos...</p>
            </div>
          </div>
        ) : hasError ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <p className="text-white mb-4">Failed to load videos</p>
              <button
                onClick={() => window.location.reload()}
                className="text-quicktok-orange hover:text-quicktok-orange/80 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <VideoFeed videos={videos} />
        )}
      </div>
    </div>
  );
};

export default VideosPage;
