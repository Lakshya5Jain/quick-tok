import React from "react";
import { GenerationProgress } from "@/types";
import { useNavigate } from "react-router-dom";

interface LoadingScreenProps {
  progress: GenerationProgress;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Redirect to the dedicated loading page
    navigate("/loading", { 
      state: { processId: progress.processId },
      replace: true
    });
  }, [navigate, progress]);

  // Return null as we're redirecting
  return null;
};

export default LoadingScreen;
