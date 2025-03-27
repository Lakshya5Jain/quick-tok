
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import GeneratorForm from "@/components/GeneratorForm";
import VideoFeed from "@/components/VideoFeed";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import { GenerationProgress, ScriptOption, Video } from "@/types";
import { generateVideo, checkProgress, getVideos } from "@/lib/api";
import { toast } from "sonner";
import { voiceOptions } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"generate" | "videos">("generate");
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [adminStats, setAdminStats] = useState<{
    total_users: number;
    total_videos: number;
    updated_at: string;
  } | null>(null);

  // Load videos on mount and when activeTab changes to videos
  useEffect(() => {
    const loadVideos = async () => {
      if (activeTab === "videos") {
        setIsLoadingVideos(true);
        try {
          const { videos: loadedVideos, stats } = await getVideos();
          console.log("Fetched videos:", loadedVideos);
          console.log("Fetched stats:", stats);
          setVideos(loadedVideos);
          setAdminStats(stats);
        } catch (error) {
          console.error("Failed to load videos:", error);
          toast.error("Failed to load past videos");
        } finally {
          setIsLoadingVideos(false);
        }
      }
    };
    
    loadVideos();
  }, [activeTab]);

  // Poll for progress updates when a process is running
  useEffect(() => {
    if (!currentProcessId) return;
    
    const pollProgress = async () => {
      try {
        const progressData = await checkProgress(currentProcessId);
        setProgress(progressData);
        
        if (progressData.progress >= 100) {
          setIsSubmitting(false);
          setShowResult(true);
          setCurrentProcessId(null);
          
          // Refresh videos list if a new video was generated
          getVideos().then(({ videos: loadedVideos, stats }) => {
            setVideos(loadedVideos);
            setAdminStats(stats);
          });
        } else {
          // Continue polling
          setTimeout(pollProgress, 1000);
        }
      } catch (error) {
        console.error("Error checking progress:", error);
        toast.error("Error checking progress");
        setIsSubmitting(false);
        setCurrentProcessId(null);
      }
    };
    
    pollProgress();
  }, [currentProcessId]);

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
      // Start video generation with the form data directly including files
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
      
      setCurrentProcessId(processId);
      setProgress({
        progress: 0,
        status: "Starting...",
      });
    } catch (error) {
      console.error("Error starting video generation:", error);
      toast.error("Failed to start video generation");
      setIsSubmitting(false);
    }
  };

  const handleResultClose = () => {
    setShowResult(false);
    // Refresh videos list
    getVideos().then(({ videos, stats }) => {
      setVideos(videos);
      setAdminStats(stats);
    });
  };

  const handleTabChange = (tab: "generate" | "videos") => {
    setActiveTab(tab);
    
    // If switching to videos tab, refresh the video list
    if (tab === "videos") {
      getVideos().then(({ videos, stats }) => {
        setVideos(videos);
        setAdminStats(stats);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-6xl mx-auto pt-8">
        <Navbar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
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
              className="max-w-2xl mx-auto"
            >
              <VideoFeed videos={videos} isLoading={isLoadingVideos} stats={adminStats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Loading overlay when generating video */}
      <AnimatePresence>
        {isSubmitting && progress && (
          <LoadingScreen progress={progress} />
        )}
      </AnimatePresence>
      
      {/* Result modal when complete */}
      <AnimatePresence>
        {showResult && progress && progress.progress >= 100 && (
          <ResultScreen 
            result={progress} 
            onClose={handleResultClose} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
