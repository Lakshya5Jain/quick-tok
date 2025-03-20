
import React from "react";
import ProgressBar from "./ProgressBar";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  progress: GenerationProgress;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-medium text-center mb-6">Processing Your Video</h2>
          
          <ProgressBar 
            progress={progress.progress} 
            status={progress.status} 
          />
          
          <div className="flex justify-center mt-8">
            <div className="relative">
              <motion.div 
                className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
