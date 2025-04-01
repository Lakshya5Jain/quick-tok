
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
import { Download, Share, Copy, Edit, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as GenerationProgress | undefined;
  const [isPlaying, setIsPlaying] = useState(false);
  
  React.useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-12 px-4">
      <motion.div 
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative bg-zinc-900/90 backdrop-blur-lg border-zinc-800 overflow-hidden shadow-2xl">
          <motion.button
            onClick={handleExit}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors z-10"
            aria-label="Exit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4" />
          </motion.button>

          <CardHeader className="pb-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <CardTitle className="text-2xl font-bold text-center text-white">Your Video is Ready!</CardTitle>
              <CardDescription className="text-gray-400 text-center">
                Check out your awesome TikTok-style video below
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="relative max-w-[280px] mx-auto w-full">
                  <div className="aspect-[9/16] relative overflow-hidden rounded-lg shadow-[0_0_25px_rgba(255,107,0,0.2)]">
                    <video 
                      className="absolute inset-0 w-full h-full object-cover bg-black"
                      onClick={(e) => {
                        const videoEl = e.currentTarget;
                        if (videoEl.paused) {
                          videoEl.play();
                          setIsPlaying(true);
                        } else {
                          videoEl.pause();
                          setIsPlaying(false);
                        }
                      }}
                    >
                      <source src={result.finalVideoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <motion.div 
                          className="w-16 h-16 flex items-center justify-center rounded-full bg-quicktok-orange/80 backdrop-blur-sm text-white"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
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
                <div className="p-4 bg-zinc-800/70 rounded-lg text-sm text-gray-300 whitespace-pre-wrap border border-zinc-700 h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                  {result.scriptText}
                </div>
                
                <div className="mt-6 flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={downloadVideo}
                      className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white font-medium"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </motion.div>
                  
                  {navigator.share && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={shareVideo}
                        variant="outline"
                        className="bg-zinc-800 text-gray-200 border-zinc-700 hover:bg-zinc-700"
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={createAnother}
                      variant="outline"
                      className="bg-green-900/30 text-green-300 border-green-800 hover:bg-green-800/50"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Create Another
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResultPage;
