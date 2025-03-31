
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";

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

  const createAnother = () => {
    navigate("/create");
  };

  return (
    <div className="min-h-screen bg-gradient-primary px-4 py-16">
      <motion.div 
        className="max-w-2xl mx-auto bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6 text-white">Your Video is Ready!</h2>
          
          <div className="video-player mb-6 mx-auto border border-zinc-700 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
            <video controls autoPlay playsInline className="w-full">
              <source src={result.finalVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-300">Script</h3>
            <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
              {result.scriptText}
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadVideo}
                className="px-4 py-2 bg-quicktok-orange text-white font-medium rounded-md hover:bg-quicktok-orange/90 transition-colors flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </motion.button>
              
              {navigator.share && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareVideo}
                  className="px-4 py-2 bg-zinc-800 text-gray-200 font-medium rounded-md hover:bg-zinc-700 transition-colors flex items-center"
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createAnother}
                className="px-4 py-2 bg-zinc-800 text-gray-200 font-medium rounded-md hover:bg-zinc-700 transition-colors"
              >
                Create Another
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultPage;
