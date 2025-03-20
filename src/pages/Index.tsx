
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import GeneratorForm from "@/components/GeneratorForm";
import VideoFeed from "@/components/VideoFeed";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import HomePage from "@/components/HomePage";
import { GenerationProgress, ScriptOption, Video } from "@/types";
import { generateVideo, checkProgress, getVideos } from "@/lib/api";
import { toast } from "sonner";
import { voiceOptions } from "@/data/mockData";

const Index = () => {
  const [showHome, setShowHome] = useState(true);
  const [activeTab, setActiveTab] = useState<"generate" | "videos">("generate");
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Load videos on mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const loadedVideos = await getVideos();
        setVideos(loadedVideos);
      } catch (error) {
        console.error("Failed to load videos:", error);
        toast.error("Failed to load past videos");
      }
    };
    
    loadVideos();
  }, []);

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
        voiceMediaFile: formData.voiceMediaFile
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
    getVideos().then(setVideos);
  };

  const handleGetStarted = () => {
    setShowHome(false);
  };

  const handleLogoClick = () => {
    setShowHome(true);
  };

  if (showHome) {
    return <HomePage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-6xl mx-auto pt-8">
        <Navbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
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
              <VideoFeed videos={videos} />
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
