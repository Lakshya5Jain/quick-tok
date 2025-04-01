
import React from "react";
import { GenerationProgress } from "@/types";
import { useNavigate } from "react-router-dom";

interface ResultScreenProps {
  result: GenerationProgress;
  onClose: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onClose }) => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Redirect to the dedicated result page
    navigate("/result", { 
      state: { result },
      replace: true
    });
  }, [navigate, result]);

  // Return null as we're redirecting
  return null;
};

export default ResultScreen;
