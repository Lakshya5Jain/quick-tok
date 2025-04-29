import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import GeneratorForm from "@/components/GeneratorForm";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import { GenerationProgress, ScriptOption } from "@/types";
import { generateVideo, checkProgress } from "@/lib/api";
import { toast } from "sonner";
import { voiceOptions } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/context/CreditsContext";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { subscription } = useCredits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [showResult, setShowResult] = useState(false);

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
    highResolution?: boolean;
  }) => {
    setIsSubmitting(true);
    
    try {
      // Always use highResolution: true
      const processId = await generateVideo({
        scriptOption: formData.scriptOption,
        topic: formData.topic,
        customScript: formData.customScript,
        supportingMedia: formData.supportingMedia,
        supportingMediaFile: formData.supportingMediaFile,
        voiceId: formData.voiceId,
        voiceMedia: formData.voiceMedia,
        voiceMediaFile: formData.voiceMediaFile,
        highResolution: true
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
  };

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-7xl mx-auto pt-8">
        <Navbar 
          activeTab="generate"
          onTabChange={() => navigate("/create")}
        />
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <GeneratorForm 
            onSubmit={handleFormSubmit} 
            isSubmitting={isSubmitting} 
            voiceOptions={voiceOptions}
          />
        </motion.div>
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
      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
