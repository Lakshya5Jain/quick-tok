
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MediaInputProps {
  title: string;
  description: string;
  useFile: boolean;
  onToggleUseFile: (useFile: boolean) => void;
  url: string;
  onUrlChange: (url: string) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  urlPlaceholder: string;
  fileAccept: string;
  onMediaAvailable: (isAvailable: boolean, mediaUrl: string | null) => void;
  defaultUrl?: string;
}

const MediaInput: React.FC<MediaInputProps> = ({
  title,
  description,
  useFile,
  onToggleUseFile,
  url,
  onUrlChange,
  selectedFile,
  onFileChange,
  urlPlaceholder,
  fileAccept,
  onMediaAvailable,
  defaultUrl
}) => {
  // When component mounts or when url/file changes, update preview and notify parent
  useEffect(() => {
    if (useFile && selectedFile) {
      const preview = URL.createObjectURL(selectedFile);
      onMediaAvailable(true, preview);
      return () => URL.revokeObjectURL(preview);
    } else if (!useFile && url) {
      onMediaAvailable(true, url);
    } else if (!useFile && defaultUrl && !url) {
      onMediaAvailable(true, defaultUrl);
      // Don't update the input value, just use the default for preview
    } else {
      onMediaAvailable(false, null);
    }
  }, [useFile, selectedFile, url, defaultUrl, onMediaAvailable]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      onFileChange(null);
      return;
    }

    const file = files[0];
    const allowedTypes = fileAccept.split(',');
    
    // Validate file type
    const fileType = file.type.toLowerCase();
    const isValidType = allowedTypes.some(type => 
      fileType === type || 
      (type.includes('image/') && fileType.includes('image/')) ||
      (type.includes('video/') && fileType.includes('video/'))
    );
    
    if (!isValidType) {
      toast.error(`Invalid file type. Please upload ${fileAccept.replace(/,/g, ' or ')}`);
      e.target.value = '';
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB');
      e.target.value = '';
      return;
    }
    
    onFileChange(file);
  };

  const clearFile = () => {
    onFileChange(null);
  };

  const clearUrl = () => {
    onUrlChange('');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-white">
          {title}
        </Label>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      
      <div className="mb-4">
        <Tabs 
          value={useFile ? "file" : "url"} 
          onValueChange={(v) => onToggleUseFile(v === "file")}
          className="w-full"
        >
          <TabsList className="w-full bg-zinc-800 border-zinc-700">
            <TabsTrigger 
              value="url" 
              className="flex-1 data-[state=active]:bg-quicktok-orange data-[state=active]:text-white"
            >
              Use URL
            </TabsTrigger>
            <TabsTrigger 
              value="file" 
              className="flex-1 data-[state=active]:bg-quicktok-orange data-[state=active]:text-white"
            >
              Upload File
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {useFile ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              onChange={handleFileChange}
              accept={fileAccept}
              className="bg-zinc-800 border-zinc-700 text-white file:bg-zinc-700 file:text-white file:border-0"
            />
            {selectedFile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="h-10 w-10 text-gray-400 hover:text-white"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="text-xs text-gray-400">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={urlPlaceholder}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearUrl}
              className="h-10 w-10 text-gray-400 hover:text-white"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaInput;
