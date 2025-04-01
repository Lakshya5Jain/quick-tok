
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
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

  if (!result || !result.finalVideoUrl || !result.scriptText) {
    return null;
  }

  const downloadVideo = () => {
    const link = document.createElement('a');
    link.href = result.finalVideoUrl!;
    link.download = 'quick-tok-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  const shareVideo = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Quick-Tok Video',
        text: 'Check out this video I created with Quick-Tok!',
        url: result.finalVideoUrl,
      })
      .catch((error) => {
        console.log('Error sharing', error);
        toast.error("Error sharing video");
      });
    } else {
      toast.info("Sharing not supported on this device");
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(result.scriptText || "");
    toast.success("Script copied to clipboard!");
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
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-12 px-4">
      <div className="container max-w-5xl mx-auto">
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
            <CardTitle className="text-2xl text-center">Your Video is Ready!</CardTitle>
            <CardDescription className="text-center">
              Check out your awesome TikTok-style video below
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <div className="relative bg-black rounded-lg overflow-hidden shadow-lg w-full max-w-[350px]">
                  <div className="aspect-[9/16] w-full">
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      src={result.finalVideoUrl}
                      playsInline
                      preload="metadata"
                      onEnded={() => setIsPlaying(false)}
                    />
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: isPlaying ? 0 : 1 }}
                      onClick={handleVideoClick}
                    >
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white">
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" />
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4 w-full max-w-[350px]">
                  <Button
                    onClick={downloadVideo}
                    className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  
                  {navigator.share && (
                    <Button
                      onClick={shareVideo}
                      variant="outline"
                      className="border-zinc-700 hover:bg-zinc-800 flex-1"
                    >
                      <Share className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-300">Script</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyScriptToClipboard}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                
                <div className="p-4 bg-zinc-800/70 rounded-lg text-sm text-gray-300 whitespace-pre-wrap border border-zinc-700 h-[250px] overflow-y-auto">
                  {result.scriptText}
                </div>
                
                <Button
                  onClick={createAnother}
                  className="w-full mt-6 bg-green-900/30 text-green-300 border border-green-800 hover:bg-green-800/50"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Create Another Video
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultPage;
