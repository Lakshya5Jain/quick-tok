
import React from "react";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ResultScreenProps {
  result: GenerationProgress;
  onClose: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onClose }) => {
  if (!result.finalVideoUrl || !result.scriptText) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="p-6">
            <h2 className="text-2xl font-medium text-center mb-6">Your Video is Ready!</h2>
            
            <div className="video-player mb-6 mx-auto">
              <video controls autoPlay playsInline>
                <source src={result.finalVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Script</h3>
              <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                {result.scriptText}
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  Generate Another Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultScreen;
