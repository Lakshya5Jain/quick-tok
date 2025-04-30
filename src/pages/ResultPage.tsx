import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GenerationProgress } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, Copy, Edit, X, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as GenerationProgress | undefined;
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (!result || !result.finalVideoUrl) {
      toast.error("No result found. Redirecting to create page.");
      navigate("/create");
    }
  }, [result, navigate]);

  useEffect(() => {
    // Add event listeners to the video element
    const videoElement = videoRef.current;
    if (videoElement) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
      
      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  if (!result || !result.finalVideoUrl || !result.scriptText) {
    return null;
  }

  const downloadVideo = () => {
    try {
      // Create an invisible anchor element
      const link = document.createElement('a');
      link.href = result.finalVideoUrl!;
      link.download = 'quick-tok-video.mp4';
      link.style.display = 'none';
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download video");
      
      // Fallback: open in a new tab
      window.open(result.finalVideoUrl, '_blank');
    }
  };

  const shareVideo = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Quick-Tok Video',
          text: 'Check out this video I created with Quick-Tok!',
          url: result.finalVideoUrl,
        });
        toast.success("Video shared successfully!");
      } else {
        setShowShareModal(true);
      }
    } catch (error) {
      console.error("Share error:", error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled share operation
        return;
      }
      setShowShareModal(true);
    }
  };

  const handleCopyShareUrl = () => {
    if (result?.finalVideoUrl) {
      navigator.clipboard.writeText(result.finalVideoUrl);
      toast.success("Video URL copied to clipboard!");
    }
  };

  const copyScriptToClipboard = () => {
    try {
      navigator.clipboard.writeText(result.scriptText || "");
      toast.success("Script copied to clipboard!");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy script");
    }
  };

  const createAnother = () => {
    navigate("/create");
  };

  const handleExit = () => {
    // Navigate to the videos tab
    navigate("/", { state: { activeTab: "videos" } });
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(error => {
              console.error("Video play error:", error);
              toast.error("Failed to play video");
            });
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black">
      <Card className="border-zinc-800 shadow-2xl w-full max-w-4xl bg-zinc-900">
        <Button
          onClick={handleExit}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-zinc-800 z-10"
        >
          <X className="h-5 w-5" />
        </Button>

        <CardHeader>
          <CardTitle className="text-2xl text-center text-quicktok-orange">Your Video is Ready!</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Check out your awesome TikTok-style video below
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col items-center">
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-black rounded-lg overflow-hidden shadow-lg w-full max-w-[350px]"
                >
                  <div className="aspect-[9/16] w-full">
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      src={result.finalVideoUrl}
                      playsInline
                      preload="auto"
                      controls={false}
                    />
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: isPlaying ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleVideoClick}
                    >
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white">
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" />
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <div className="flex gap-3 mt-4 w-full max-w-[350px]">
                <Button
                  onClick={downloadVideo}
                  className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white transition-colors flex-1 font-semibold shadow-md"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                
                <Button
                  onClick={shareVideo}
                  className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white transition-colors flex-1 font-semibold shadow-md"
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-quicktok-orange">Script</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyScriptToClipboard}
                  className="text-quicktok-orange hover:bg-zinc-800 hover:text-white"
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </div>
              
              <div className="p-4 bg-zinc-800/90 rounded-lg text-sm text-gray-100 whitespace-pre-wrap border border-zinc-700 h-[250px] overflow-y-auto">
                {result.scriptText}
              </div>
              
              <Button
                onClick={createAnother}
                className="w-full mt-6 bg-quicktok-orange hover:bg-quicktok-orange/90 text-white font-semibold border-none shadow-md"
              >
                <Edit className="mr-2 h-4 w-4" />
                Create Another Video
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
      {/* Share Modal for fallback */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center">
            <h3 className="text-lg font-semibold text-quicktok-orange mb-2">Share this Video</h3>
            <p className="text-gray-300 text-sm mb-4 text-center">Copy the link below and share it anywhere!</p>
            <div className="w-full flex items-center bg-zinc-800 rounded px-3 py-2 mb-4">
              <span className="text-xs text-gray-200 truncate flex-1">{result.finalVideoUrl}</span>
              <Button size="sm" variant="ghost" className="ml-2 text-quicktok-orange" onClick={handleCopyShareUrl}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <Button className="w-full bg-quicktok-orange text-white mt-2" onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;
