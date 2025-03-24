
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import GeneratorForm from "@/components/GeneratorForm";
import VideoFeed from "@/components/VideoFeed";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import ScriptReviewModal from "@/components/generator/ScriptReviewModal"; // Import the new component
import { GenerationProgress, ScriptOption, Video } from "@/types";
import { generateVideo, checkProgress, getVideos } from "@/lib/api";
import { toast } from "sonner";
import { voiceOptions } from "@/data/mockData";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"generate" | "videos">("generate");
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // New state for script review
  const [showScriptReview, setShowScriptReview] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [pendingFormData, setPendingFormData] = useState<any>(null);

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
        
        // If script generation is complete but video generation hasn't started yet
        if (progressData.progress >= 30 && progressData.progress < 50 && progressData.scriptText && !showScriptReview) {
          setIsSubmitting(false);
          setGeneratedScript(progressData.scriptText);
          setShowScriptReview(true);
          setCurrentProcessId(null);
        } else if (progressData.progress >= 100) {
          // Video is complete
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
  }, [currentProcessId, showScriptReview]);

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
    searchWeb?: boolean;
  }) => {
    setIsSubmitting(true);
    
    try {
      if (formData.scriptOption === ScriptOption.GPT && formData.topic) {
        // Store form data to be used after script review
        setPendingFormData(formData);
        
        // Start script generation only
        const processId = await generateVideo({
          ...formData,
          scriptGenerationOnly: true
        });
        
        setCurrentProcessId(processId);
        setProgress({
          progress: 0,
          status: "Generating script...",
        });
      } else {
        // Custom script, proceed directly to video generation
        const processId = await generateVideo(formData);
        
        setCurrentProcessId(processId);
        setProgress({
          progress: 0,
          status: "Starting...",
        });
      }
    } catch (error) {
      console.error("Error starting video generation:", error);
      toast.error("Failed to start video generation");
      setIsSubmitting(false);
    }
  };

  const handleScriptReviewClose = () => {
    setShowScriptReview(false);
    setGeneratedScript("");
    setPendingFormData(null);
  };

  const handleScriptConfirm = async (finalScript: string) => {
    if (!pendingFormData) {
      toast.error("Missing form data. Please try again.");
      setShowScriptReview(false);
      return;
    }

    setShowScriptReview(false);
    setIsSubmitting(true);

    try {
      // Continue with video generation using the reviewed script
      const processId = await generateVideo({
        ...pendingFormData,
        customScript: finalScript,
        scriptOption: ScriptOption.CUSTOM, // Override to use the reviewed script
        continueFromScript: true
      });
      
      setCurrentProcessId(processId);
      setProgress({
        progress: 30,
        status: "Creating video from script...",
      });
    } catch (error) {
      console.error("Error continuing video generation:", error);
      toast.error("Failed to continue video generation");
      setIsSubmitting(false);
    }
  };

  const handleResultClose = () => {
    setShowResult(false);
    // Refresh videos list
    getVideos().then(setVideos);
  };

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-6xl mx-auto pt-8">
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
      
      {/* Script review modal */}
      <AnimatePresence>
        {showScriptReview && (
          <ScriptReviewModal 
            script={generatedScript}
            onClose={handleScriptReviewClose}
            onConfirm={handleScriptConfirm}
            isLoading={isSubmitting}
          />
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
