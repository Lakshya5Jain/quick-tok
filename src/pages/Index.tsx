
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import GeneratorForm from "@/components/GeneratorForm";
import VideoFeed from "@/components/VideoFeed";
import { ScriptOption, Video } from "@/types";
import { generateVideo, getVideos } from "@/lib/api";
import { toast } from "sonner";
import { voiceOptions } from "@/data/mockData";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"generate" | "videos">(
    location.state?.activeTab || "generate"
  );
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Update activeTab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Load videos when activeTab is "videos" or on component mount
  useEffect(() => {
    const loadVideos = async () => {
      if (activeTab === "videos" || isLoadingVideos) {
        setIsLoadingVideos(true);
        try {
          const loadedVideos = await getVideos();
          setVideos(loadedVideos);
        } catch (error) {
          console.error("Failed to load videos:", error);
          toast.error("Failed to load videos");
        } finally {
          setIsLoadingVideos(false);
        }
      }
    };
    
    loadVideos();
  }, [activeTab]);

  const handleFormSubmit = async (formData: {
    scriptOption: ScriptOption;
    topic?: string;
    customScript?: string;
    supportingMedia?: string;
    supportingMediaFile?: File;
    voiceId: string;
    voiceMedia?: string;
    voiceMediaFile?: File;
    highResolution: boolean;
  }) => {
    setIsSubmitting(true);
    
    try {
      const processId = await generateVideo({
        scriptOption: formData.scriptOption,
        topic: formData.topic,
        customScript: formData.customScript,
        supportingMedia: formData.supportingMedia,
        supportingMediaFile: formData.supportingMediaFile,
        voiceId: formData.voiceId,
        voiceMedia: formData.voiceMedia,
        voiceMediaFile: formData.voiceMediaFile,
        highResolution: formData.highResolution
      });
      
      navigate("/loading", { state: { processId } });
    } catch (error) {
      console.error("Error starting video generation:", error);
      toast.error("Failed to start video generation");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black px-4 pb-16">
      <div className="container max-w-6xl mx-auto pt-8">
        <Navbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
        
        <AnimatePresence mode="wait">
          {activeTab === "generate" ? (
            <motion.div
              key="generator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <GeneratorForm 
                onSubmit={handleFormSubmit} 
                isSubmitting={isSubmitting} 
                voiceOptions={voiceOptions}
              />
            </motion.div>
          ) : (
            <motion.div
              key="videos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="py-4">
                <h2 className="text-2xl font-bold text-white mb-6">My Videos</h2>
                <VideoFeed 
                  videos={videos}
                  isLoading={isLoadingVideos}
                  onVideoClick={(video) => {
                    navigate("/result", { 
                      state: { 
                        result: {
                          finalVideoUrl: video.finalVideoUrl,
                          scriptText: video.scriptText,
                          progress: 100,
                          status: "Complete"
                        }
                      }
                    });
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
