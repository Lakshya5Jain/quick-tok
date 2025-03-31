
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
import { checkProgress } from "@/lib/api";
import { toast } from "sonner";

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = React.useState<GenerationProgress>({
    progress: 0,
    status: "Starting up the AI engines..."
  });
  
  const processId = location.state?.processId;
  
  useEffect(() => {
    if (!processId) {
      toast.error("No process ID found. Redirecting to create page.");
      navigate("/create");
      return;
    }
    
    const pollProgress = async () => {
      try {
        const progressData = await checkProgress(processId);
        setProgress(progressData);
        
        if (progressData.progress >= 100) {
          navigate("/result", { 
            state: { result: progressData },
            replace: true 
          });
        } else {
          // Continue polling
          setTimeout(pollProgress, 2000);
        }
      } catch (error) {
        console.error("Error checking progress:", error);
        toast.error("Error checking progress. Please try again.");
        navigate("/create");
      }
    };
    
    pollProgress();
    
    // Cleanup on unmount
    return () => {
      // Any cleanup here if needed
    };
  }, [processId, navigate]);

  // Get appropriate message based on status
  const getMessage = () => {
    if (progress.status.includes("Uploading")) {
      return "Preparing your media for AI processing...";
    } else if (progress.status.includes("Generating script")) {
      return "Creating an engaging script with our AI...";
    } else if (progress.status.includes("Generating AI video")) {
      return "Bringing your images to life with Infinity AI...";
    } else if (progress.status.includes("Creating final")) {
      return "Fusing your videos together with Creatomate...";
    } else if (progress.status.includes("Complete")) {
      return "Your awesome TikTok video is ready!";
    }
    return "Starting up the AI engines...";
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <motion.div 
        className="max-w-md w-full p-8 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-quicktok-orange">Processing Your Video</h2>
          <p className="text-gray-300 text-center mb-6">{getMessage()}</p>
          
          {/* Progress indicator */}
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
      </motion.div>
    </div>
  );
};

export default LoadingPage;
