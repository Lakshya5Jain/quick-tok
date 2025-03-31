
import React from "react";
import { GenerationProgress } from "@/types";
import { useNavigate } from "react-router-dom";

interface LoadingScreenProps {
  progress: GenerationProgress;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Get processId from progress or use it as the processId itself if it's a string
    const processId = typeof progress === 'string' ? progress : progress.processId;
    
    if (!processId) {
      console.error("No process ID found in progress object:", progress);
      return;
    }
    
    // Redirect to the dedicated loading page
    navigate("/loading", { 
      state: { processId },
      replace: true
    });
  }, [navigate, progress]);

  // Return null as we're redirecting
  return null;
};

export default LoadingScreen;
