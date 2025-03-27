
import React, { useEffect, useState } from "react";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  progress: GenerationProgress;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [message, setMessage] = useState("Starting up the AI engines...");
  
  // Map progress values to more natural-looking progress
  const getNormalizedProgress = () => {
    const { status, progress: rawProgress } = progress;
    
    // Enforce milestone percentages
    if (status.includes("Generating script")) {
      return Math.min(25, rawProgress);
    } else if (status.includes("Generating AI video")) {
      return 25 + Math.min(25, (rawProgress - 25) * (25/25));
    } else if (status.includes("Creating final")) {
      return 50 + Math.min(25, (rawProgress - 50) * (25/25));
    } else if (status.includes("Complete")) {
      return 100;
    } else if (rawProgress < 100) {
      // For other statuses, make progress smoother
      return rawProgress;
    }
    
    return rawProgress;
  };

  // Normalized progress for display
  const displayProgress = getNormalizedProgress();
  
  // Change detailed message based on status
  useEffect(() => {
    if (progress.status.includes("Uploading") || progress.status.includes("Starting")) {
      setMessage("Preparing your media for AI processing...");
    } else if (progress.status.includes("Generating script")) {
      setMessage("Creating an engaging script with our AI...");
    } else if (progress.status.includes("Generating AI video")) {
      setMessage("Bringing your images to life with Infinity AI...");
    } else if (progress.status.includes("Creating final")) {
      setMessage("Fusing your videos together with Creatomate...");
    } else if (progress.status.includes("Complete")) {
      setMessage("Your awesome TikTok video is ready!");
    }
  }, [progress.status]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-md w-full p-8 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-quicktok-orange">Processing Your Video</h2>
          <p className="text-gray-300 text-center mb-6">{message}</p>
          
          {/* Progress indicator */}
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-quicktok-orange"
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Progress percentage */}
          <p className="text-quicktok-orange font-medium mt-2">{Math.round(displayProgress)}%</p>
          
          {/* Milestone indicators */}
          <div className="w-full flex justify-between mt-2 px-1 text-xs text-gray-500">
            <span>Start</span>
            <span>Script</span>
            <span>AI Video</span>
            <span>Final</span>
          </div>
          
          {/* Bouncing animation */}
          <div className="flex justify-center mt-8">
            <motion.div
              className="w-12 h-12 rounded-full bg-quicktok-orange"
              animate={{
                y: [0, -20, 0],
                scale: [1, 0.8, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <p className="text-sm text-gray-400 mt-6 text-center">
            {progress.status}
          </p>
          
          <p className="text-xs text-gray-500 mt-8 text-center">
            Powered by Creatomate API for Automated Video Generation<br />
            and Lemon Slice for Talking Avatar
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
