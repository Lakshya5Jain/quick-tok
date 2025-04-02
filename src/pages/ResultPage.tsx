
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
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(result.finalVideoUrl!);
        toast.success("Video URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled share operation
        return;
      }
      
      // Try the clipboard fallback if share fails for other reasons
      try {
        await navigator.clipboard.writeText(result.finalVideoUrl!);
        toast.success("Video URL copied to clipboard!");
      } catch (clipboardError) {
        toast.error("Failed to share video");
      }
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
    <div className="min-h-screen overflow-hidden relative bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* Lava lamp background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black opacity-80"></div>
        
        {/* Smooth lava lamp bubbles */}
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
              duration: 20 + Math.random() * 10,
              ease: "linear",
              delay: i * 2,
            }}
          />
        ))}
      </div>

      <div className="container max-w-5xl mx-auto py-12 px-4 relative z-10">
        <Card className="bg-zinc-900/90 border-zinc-800 overflow-hidden shadow-2xl">
          <Button
            onClick={handleExit}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-zinc-800 z-10"
          >
            <X className="h-5 w-5" />
          </Button>

          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">Your Video is Ready!</CardTitle>
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
                    className="bg-zinc-800 hover:bg-quicktok-orange text-gray-200 hover:text-white transition-colors flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={shareVideo}
                    variant="outline"
                    className="bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-quicktok-orange hover:text-white hover:border-quicktok-orange transition-colors flex-1"
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
                  <h3 className="text-lg font-medium text-gray-300">Script</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyScriptToClipboard}
                    className="text-gray-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                
                <div className="p-4 bg-zinc-800/70 rounded-lg text-sm text-gray-300 whitespace-pre-wrap border border-zinc-700 h-[250px] overflow-y-auto">
                  {result.scriptText}
                </div>
                
                <Button
                  onClick={createAnother}
                  className="w-full mt-6 bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-quicktok-orange hover:text-white hover:border-quicktok-orange transition-colors"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Create Another Video
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center text-xs text-gray-500 mt-4 relative z-10">
        Powered by Creatomate and Lemon Slice
      </div>
    </div>
  );
};

export default ResultPage;
