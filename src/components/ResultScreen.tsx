
import React, { useEffect } from "react";
import { GenerationProgress } from "@/types";
import { useNavigate } from "react-router-dom";

interface ResultScreenProps {
  result: GenerationProgress;
  onClose: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onClose }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the dedicated result page with the data
    if (result && result.finalVideoUrl) {
      navigate("/result", { 
        state: { result },
        replace: true
      });
    }
  }, [navigate, result]);

  // Return null as we're redirecting
  return null;
};

export default ResultScreen;
