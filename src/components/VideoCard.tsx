
import React, { useState } from "react";
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

  const downloadVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const link = document.createElement('a');
    link.href = video.finalVideoUrl;
    link.download = `quick-tok-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Download started!");
  };

  const shareVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: 'My Quick-Tok Video',
        text: 'Check out this video I created with Quick-Tok!',
        url: video.finalVideoUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      toast.info("Sharing not supported on this device");
    }
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const videoEl = e.currentTarget.querySelector('video');
    
    if (videoEl) {
      if (videoEl.paused) {
        videoEl.play();
        setIsPlaying(true);
      } else {
        videoEl.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <Card 
      className="bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 transition-all duration-300 shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[180px]">
            <div className="relative aspect-[9/16] mx-auto max-w-[180px]" onClick={handleVideoClick}>
              <video 
                className="rounded-lg w-full h-full object-cover bg-black cursor-pointer"
                src={video.finalVideoUrl}
                poster={`${video.finalVideoUrl}?poster=true`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
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
              <div className="p-4 bg-zinc-800/70 rounded-lg text-sm text-gray-300 max-h-[120px] overflow-y-auto">
                {video.scriptText}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-zinc-800">
              <div className="text-xs text-gray-500">
                Created: {formatDate(video.timestamp)}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-gray-300 border-zinc-800 hover:bg-zinc-800"
                  onClick={downloadVideo}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                {navigator.share && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-gray-300 border-zinc-800 hover:bg-zinc-800"
                    onClick={shareVideo}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;
