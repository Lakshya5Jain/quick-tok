
import React from "react";
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
        className="relative max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={handleExit}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors z-10"
          aria-label="Exit"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-4 w-4" />
        </motion.button>

        <Card className="bg-zinc-900/90 backdrop-blur-lg border-zinc-800 overflow-hidden shadow-2xl">
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
          
          <CardContent className="space-y-6">
            <motion.div 
              className="video-player mx-auto border border-zinc-700 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(255,107,0,0.2)]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative aspect-[9/16] max-w-[280px] mx-auto overflow-hidden">
                <video 
                  controls 
                  autoPlay 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                >
                  <source src={result.finalVideoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-3"
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
              <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300 whitespace-pre-wrap border border-zinc-700 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                {result.scriptText}
              </div>
            </motion.div>
          </CardContent>
          
          <CardFooter className="flex flex-wrap justify-center gap-4 mt-2 pb-6">
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
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResultPage;
