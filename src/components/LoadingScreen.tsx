
import React, { useEffect, useState } from "react";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  progress: GenerationProgress;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [message, setMessage] = useState("Starting up the AI engines...");
  
  // Change detailed message based on status
  useEffect(() => {
    if (progress.status.includes("Uploading")) {
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
          
          {/* Single progress indicator */}
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-quicktok-orange"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Progress percentage */}
          <p className="text-quicktok-orange font-medium mt-2">{progress.progress}%</p>
          
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
