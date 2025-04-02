
import React, { useState, useRef } from "react";
import { Video } from "@/types";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Download, Share, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const downloadVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const link = document.createElement('a');
      link.href = video.finalVideoUrl;
      link.download = `quick-tok-${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download video");
    }
  };

  const shareVideo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Quick-Tok Video',
          text: 'Check out this video I created with Quick-Tok!',
          url: video.finalVideoUrl,
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        navigator.clipboard.writeText(video.finalVideoUrl);
        toast.success("Video URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled share operation
        return;
      }
      toast.error("Failed to share video");
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <Card 
      className="overflow-hidden bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-all duration-300"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-[160px] shrink-0">
            <div className="relative aspect-[9/16] h-[240px] md:h-auto mx-auto" onClick={handleVideoClick}>
              <video 
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover rounded-lg"
                src={video.finalVideoUrl}
                poster={`${video.finalVideoUrl}?poster=true`}
                playsInline
                preload="metadata"
                onEnded={() => setIsPlaying(false)}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className={`w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-1" />
                  )}
                </motion.div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-200 mb-2">Video Script</h3>
              <div className="p-3 bg-zinc-800/70 rounded-lg text-sm text-gray-300 max-h-[120px] overflow-y-auto">
                {video.scriptText}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
              <div className="text-xs text-gray-400">
                Created: {formatDate(video.timestamp)}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-gray-300 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  onClick={downloadVideo}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-gray-300 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  onClick={shareVideo}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;
