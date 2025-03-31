
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
import { checkProgress } from "@/lib/api";
import { toast } from "sonner";
import { X, LoaderCircle, Clock, Sparkles, PencilLine, Film, Upload, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = React.useState<GenerationProgress>({
    progress: 0,
    status: "Starting up the AI engines..."
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(300); // 5 minutes in seconds
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  
  const processId = location.state?.processId;
  
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
        
        // Add new status message if it changed
        if (progressData.status && !statusMessages.includes(progressData.status)) {
          setStatusMessages(prev => [...prev, progressData.status]);
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
  }, [processId, navigate, statusMessages]);

  // Get appropriate message and icon based on status
  const getStatusInfo = () => {
    if (progress.status.includes("Uploading")) {
      return {
        message: "Preparing your media for AI processing...",
        icon: <Upload className="text-blue-400 animate-pulse" />
      };
    } else if (progress.status.includes("Generating script")) {
      return {
        message: "Creating an engaging script with our AI...",
        icon: <PencilLine className="text-green-400 animate-pulse" />
      };
    } else if (progress.status.includes("Generating AI video")) {
      return {
        message: "Bringing your images to life with AI...",
        icon: <Sparkles className="text-purple-400 animate-pulse" />
      };
    } else if (progress.status.includes("Creating final")) {
      return {
        message: "Fusing your videos together...",
        icon: <Film className="text-orange-400 animate-pulse" />
      };
    } else if (progress.status.includes("Complete")) {
      return {
        message: "Your awesome TikTok video is ready!",
        icon: <Check className="text-green-500" />
      };
    }
    return {
      message: "Starting up the AI engines...",
      icon: <LoaderCircle className="text-quicktok-orange animate-spin" />
    };
  };

  const { message, icon } = getStatusInfo();
  
  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    toast.info("Processing canceled");
    navigate("/create");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-4">
      <motion.div 
        className="relative max-w-md w-full p-8 bg-zinc-900/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-zinc-800"
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
          <motion.div 
            className="mb-6 p-4 rounded-full bg-zinc-800 shadow-[0_0_15px_rgba(255,107,0,0.3)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            {icon}
          </motion.div>

          <h2 className="text-2xl font-bold text-center mb-2 text-quicktok-orange">Processing Your Video</h2>
          <p className="text-gray-300 text-center mb-6">{message}</p>
          
          {/* Time indicator */}
          <div className="flex items-center justify-center mb-4 text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-2" />
            <span>Elapsed: {formatTime(elapsedTime)} | Remaining: ~{formatTime(remainingTime)}</span>
          </div>

          {/* Progress indicator */}
          <div className="w-full mb-2">
            <Progress value={progress.progress} className="h-2 bg-zinc-800" />
          </div>
          
          {/* Progress percentage */}
          <p className="text-quicktok-orange font-medium mb-6">{progress.progress}%</p>
          
          {/* Status timeline */}
          <div className="w-full border-l-2 border-zinc-800 pl-4 space-y-3 mb-6">
            {statusMessages.map((status, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start"
              >
                <div className="w-2 h-2 rounded-full bg-quicktok-orange mt-1.5 -ml-5 mr-3" />
                <p className="text-sm text-gray-400">{status}</p>
              </motion.div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            Powered by Creatomate API for Automated Video Generation<br />
            and Lemon Slice for Talking Avatar
          </p>
        </motion.div>
      </motion.div>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Cancel Video Generation?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel this video generation? All progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="bg-zinc-800 hover:bg-zinc-700 text-gray-200 border-zinc-700">
              Continue Processing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoadingPage;
