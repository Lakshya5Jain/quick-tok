import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
import { checkProgress, cancelVideoGeneration } from "@/lib/api";
import { toast } from "sonner";
import { Clock, Sparkles, PencilLine, Film, Upload, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = React.useState<GenerationProgress>({
    progress: 0,
    status: "Starting up the AI engines..."
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  const processId = location.state?.processId;
  
  // Define the steps for the video creation process
  const steps = [
    { id: 0, label: "Generating AI Script", icon: <PencilLine className="text-green-400" /> },
    { id: 1, label: "Bringing your image to life with Lemon Slice", icon: <Sparkles className="text-purple-400" /> },
    { id: 2, label: "Fusing everything together with Creatomate", icon: <Film className="text-orange-400" /> },
    { id: 3, label: "Your awesome video is ready!", icon: <Check className="text-green-500" /> }
  ];
  
  useEffect(() => {
    if (!processId) {
      toast.error("No process ID found. Redirecting to create page.");
      navigate("/create");
      return;
    }
    
    // Start timer
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    const pollProgress = async () => {
      try {
        const progressData = await checkProgress(processId);
        setProgress(progressData);
        
        // Count words in script if available
        if (progressData.scriptText && wordCount === 0) {
          const words = progressData.scriptText.trim().split(/\s+/).length;
          setWordCount(words);
        }
        
        // Determine current step based on status
        if (progressData.status.includes("Generating script")) {
          setCurrentStep(0);
        } else if (progressData.status.includes("Generating AI video")) {
          setCurrentStep(1);
        } else if (progressData.status.includes("Creating final")) {
          setCurrentStep(2);
        } else if (progressData.status.includes("Complete")) {
          setCurrentStep(3);
        }
        
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
      clearInterval(timerInterval);
    };
  }, [processId, navigate, wordCount]);

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    // Call cancelVideoGeneration to stop the process
    if (processId) {
      const success = cancelVideoGeneration(processId);
      if (success) {
        toast.info("Video generation canceled");
      } else {
        toast.error("Error canceling the process");
      }
    }
    navigate("/create");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Updated formula: 2 minutes (120 seconds) + 10 seconds per word
  const estimatedTimeInSeconds = wordCount > 0 ? 120 + (wordCount * 10) : 0;
  const remainingTime = Math.max(0, estimatedTimeInSeconds - elapsedTime);

  return (
    <div className="min-h-screen overflow-hidden relative bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* Improved lava lamp effect background - using fixed positions and longer transitions */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black opacity-80"></div>
        
        {/* Fewer bubbles with longer, smoother transitions */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-xl"
            style={{
              backgroundColor: i % 2 === 0 
                ? `rgba(255, ${107 + Math.floor(Math.random() * 30)}, ${Math.floor(Math.random() * 60)}, 0.${5 + Math.floor(Math.random() * 3)})` 
                : `rgba(${220 + Math.floor(Math.random() * 35)}, ${100 + Math.floor(Math.random() * 20)}, 0, 0.${5 + Math.floor(Math.random() * 3)})`,
              width: 120 + Math.random() * 200,
              height: 120 + Math.random() * 200,
              left: `${20 + (i * 8) + Math.random() * 40}%`,
              bottom: `-${50 + Math.random() * 10}%`,
            }}
            initial={{ y: 0 }}
            animate={{ 
              y: [0, -500 - Math.random() * 500],
              x: [0, Math.sin(i) * 40],
              scale: [1, 1 + Math.random() * 0.2, 1 - Math.random() * 0.1, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 20 + Math.random() * 10, // Much longer durations
              ease: "linear",
              delay: i * 2, // Staggered start times
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-center p-4 min-h-screen relative z-10">
        <motion.div 
          className="relative max-w-md w-full p-8 bg-zinc-900/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/80"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={handleCancel}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors z-10"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            {/* Improved pulsing glow instead of bouncing ball */}
            <motion.div 
              className="mb-6 relative h-16 w-16 flex items-center justify-center"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-quicktok-orange to-rose-600 rounded-full opacity-80"
                animate={{
                  opacity: [0.7, 0.9, 0.7],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-quicktok-orange to-rose-600 rounded-full" />
            </motion.div>

            <h2 className="text-2xl font-bold text-center mb-2 text-quicktok-orange">Processing Your Video</h2>
            
            {/* Time indicator with improved estimation - only show after we have word count */}
            {wordCount > 0 && (
              <div className="flex items-center justify-center mb-4 text-sm text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                <span>Elapsed: {formatTime(elapsedTime)} | Remaining: ~{formatTime(remainingTime)}</span>
              </div>
            )}

            {/* User message about loading time */}
            <div className="w-full mb-4">
              <p className="text-center text-sm text-gray-400">
                {remainingTime > 0 || progress.progress >= 100
                  ? "It takes a while to generate these videos, but it's worth it!"
                  : "Don't worry, your video is still generating. Our servers are just overwhelmed, so it will be a little longer."}
              </p>
            </div>

            {/* Progress indicator */}
            <div className="w-full mb-2">
              <Progress value={progress.progress} className="h-2 bg-zinc-800" />
            </div>
            
            {/* Progress percentage */}
            <p className="text-quicktok-orange font-medium mb-6">{progress.progress}%</p>
            
            {/* Status timeline - only show steps */}
            <div className="w-full border-l-2 border-zinc-800 pl-4 space-y-3 mb-6">
              {steps.map((step, index) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: index <= currentStep ? 1 : 0.4, x: 0 }}
                  animate={{ 
                    opacity: index <= currentStep ? 1 : 0.4,
                    x: 0
                  }}
                  className="flex items-start"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 -ml-5 mr-3 ${
                    index < currentStep ? 'bg-green-500' : 
                    index === currentStep ? 'bg-quicktok-orange' : 
                    'bg-gray-600'
                  }`} />
                  <div className="flex items-center">
                    <span className={`mr-2 ${
                      index <= currentStep ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {step.icon}
                    </span>
                    <p className={`text-sm ${
                      index <= currentStep ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">Cancel Video Generation?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to cancel this video generation? All progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-gray-200 border-zinc-700">
              Continue Processing
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LoadingPage;
