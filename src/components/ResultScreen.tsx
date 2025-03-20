
import React from "react";
import { GenerationProgress } from "@/types";
import { motion } from "framer-motion";
import { X, Download, Share } from "lucide-react";

interface ResultScreenProps {
  result: GenerationProgress;
  onClose: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onClose }) => {
  if (!result.finalVideoUrl || !result.scriptText) {
    return null;
  }

  const downloadVideo = () => {
    const link = document.createElement('a');
    link.href = result.finalVideoUrl!;
    link.download = 'quick-tok-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareVideo = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Quick-Tok Video',
        text: 'Check out this video I created with Quick-Tok!',
        url: result.finalVideoUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-2xl bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-white">Your Video is Ready!</h2>
            
            <div className="video-player mb-6 mx-auto border border-zinc-700 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
              <video controls autoPlay playsInline>
                <source src={result.finalVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300">Script</h3>
              <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
                {result.scriptText}
              </div>
              
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={downloadVideo}
                  className="px-4 py-2 bg-quicktok-orange text-white font-medium rounded-md hover:bg-quicktok-orange/90 transition-colors flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </button>
                
                {navigator.share && (
                  <button
                    onClick={shareVideo}
                    className="px-4 py-2 bg-zinc-800 text-gray-200 font-medium rounded-md hover:bg-zinc-700 transition-colors flex items-center"
                  >
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 text-gray-200 font-medium rounded-md hover:bg-zinc-700 transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultScreen;
