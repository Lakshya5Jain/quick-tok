import React, { useState } from "react";
import { Video } from "@/types";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Download, Share, Play, Pause, Maximize2, Minimize2, Copy } from "lucide-react";

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const downloadVideo = () => {
    const link = document.createElement('a');
    link.href = video.finalVideoUrl;
    link.download = `quick-tok-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareVideo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Quick-Tok Video',
          text: 'Check out this video I created with Quick-Tok!',
          url: video.finalVideoUrl,
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(video.finalVideoUrl);
  };

  const togglePlay = () => {
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

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <motion.div 
      className="mb-8 overflow-hidden bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative aspect-[9/16] bg-black">
        <video 
          ref={videoRef}
          className="w-full h-full object-contain"
          src={video.finalVideoUrl}
          playsInline
          preload="auto"
          controls={false}
          onClick={togglePlay}
        />
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
          <motion.div 
            className="w-16 h-16 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: isPlaying ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </motion.div>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-200">Video Script</h3>
          <div className="flex gap-2">
            <button 
              onClick={downloadVideo}
              className="p-2 rounded-md bg-quicktok-orange hover:bg-quicktok-orange/90 text-white font-semibold shadow-md transition-colors"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={shareVideo}
              className="p-2 rounded-md bg-quicktok-orange hover:bg-quicktok-orange/90 text-white font-semibold shadow-md transition-colors"
              aria-label="Share"
            >
              <Share className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300 max-h-32 overflow-y-auto">
          {video.scriptText}
        </div>
        <div className="text-xs text-gray-500">
          Created on: {formatDate(video.timestamp)}
        </div>
      </div>
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center">
            <h3 className="text-lg font-semibold text-quicktok-orange mb-2">Share this Video</h3>
            <p className="text-gray-300 text-sm mb-4 text-center">Copy the link below and share it anywhere!</p>
            <div className="w-full flex items-center bg-zinc-800 rounded px-3 py-2 mb-4">
              <span className="text-xs text-gray-200 truncate flex-1">{video.finalVideoUrl}</span>
              <button className="ml-2 text-quicktok-orange hover:text-white" onClick={handleCopyShareUrl}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </button>
            </div>
            <button className="w-full bg-quicktok-orange text-white mt-2 rounded-md py-2 font-semibold" onClick={() => setShowShareModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VideoCard;
