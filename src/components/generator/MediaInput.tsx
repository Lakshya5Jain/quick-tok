
import React, { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface MediaInputProps {
  title: string;
  description?: string;
  useFile: boolean;
  onToggleUseFile: (useFile: boolean) => void;
  url: string;
  onUrlChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
  urlPlaceholder: string;
  fileAccept?: string;
  selectedFile?: File | null;
  // Track when a valid URL or file is available
  onMediaAvailable?: (isAvailable: boolean, mediaUrl: string | null) => void;
  defaultUrl?: string;
}

const MediaInput: React.FC<MediaInputProps> = ({
  title,
  description,
  useFile,
  onToggleUseFile,
  url,
  onUrlChange,
  onFileChange,
  urlPlaceholder,
  fileAccept = "image/*",
  selectedFile = null,
  onMediaAvailable,
  defaultUrl,
}) => {
  // State to track file preview URL
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  
  // Only initialize URL with default for voice character, not for supporting media
  useEffect(() => {
    if (defaultUrl && !url && !useFile && title === "Supporting Media") {
      // Initialize supporting media with empty string (no default)
      onUrlChange("");
    } else if (defaultUrl && !url && !useFile) {
      onUrlChange(defaultUrl);
    }
  }, [defaultUrl, url, useFile, title]);
  
  // Create or update preview URL when file changes
  useEffect(() => {
    if (selectedFile) {
      if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      
      // If there's a publicUrl property from Supabase, use that
      if ('publicUrl' in selectedFile) {
        // @ts-ignore - we added this property in the FileUpload component
        setFilePreviewUrl(selectedFile.publicUrl);
        if (onMediaAvailable) {
          // @ts-ignore - we added this property in the FileUpload component
          onMediaAvailable(true, selectedFile.publicUrl);
        }
      } else {
        // Otherwise, create a blob URL for preview
        const newPreviewUrl = URL.createObjectURL(selectedFile);
        setFilePreviewUrl(newPreviewUrl);
        
        if (onMediaAvailable) {
          onMediaAvailable(true, newPreviewUrl);
        }
        
        // Clean up blob URL when component unmounts
        return () => {
          if (newPreviewUrl && newPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(newPreviewUrl);
          }
        };
      }
    } else {
      setFilePreviewUrl(null);
      
      if (onMediaAvailable && !useFile) {
        onMediaAvailable(!!url, url || null);
      }
    }
  }, [selectedFile]);
  
  // Notify parent when URL changes
  useEffect(() => {
    if (!useFile && onMediaAvailable) {
      onMediaAvailable(!!url, url || null);
    }
  }, [url, useFile]);
  
  // Handle toggling between URL and file upload
  const handleToggleUseFile = (value: boolean) => {
    onToggleUseFile(value);
    
    if (onMediaAvailable) {
      if (value) {
        onMediaAvailable(!!selectedFile, filePreviewUrl);
      } else {
        onMediaAvailable(!!url, url || null);
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-200">
        {title}
      </label>
      
      <ToggleGroup 
        type="single"
        value={useFile ? "file" : "url"}
        onValueChange={(value) => value && handleToggleUseFile(value === "file")}
        className="bg-zinc-800 p-1 rounded-lg w-full flex mb-3"
      >
        <ToggleGroupItem 
          value="url"
          className="flex-1 rounded-md data-[state=on]:bg-quicktok-orange data-[state=on]:text-white"
        >
          Use URL
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="file"
          className="flex-1 rounded-md data-[state=on]:bg-quicktok-orange data-[state=on]:text-white"
        >
          Upload File
        </ToggleGroupItem>
      </ToggleGroup>

      {!useFile ? (
        <input
          type="url"
          id={title.replace(/\s+/g, "")}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={urlPlaceholder}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50 focus:border-quicktok-orange"
        />
      ) : (
        <FileUpload
          id={`${title.replace(/\s+/g, "")}File`}
          label=""
          accept={fileAccept}
          onFileChange={onFileChange}
          initialFile={selectedFile}
        />
      )}
      
      {description && (
        <p className="text-xs text-gray-400 mt-1">
          {description}
        </p>
      )}
      
      {/* Show preview of the current media if available */}
      {useFile && filePreviewUrl && (
        <div className="mt-3 rounded-lg overflow-hidden max-h-40 border border-zinc-700">
          {filePreviewUrl.includes("video") ? (
            <video src={filePreviewUrl} className="max-h-40 w-auto" controls muted />
          ) : (
            <img src={filePreviewUrl} alt="Preview" className="max-h-40 w-auto" />
          )}
        </div>
      )}
      {!useFile && url && (
        <div className="mt-3 rounded-lg overflow-hidden max-h-40 border border-zinc-700">
          {url.match(/\.(mp4|webm|ogg)$/i) ? (
            <video src={url} className="max-h-40 w-auto" controls muted />
          ) : (
            <img src={url} alt="Preview" className="max-h-40 w-auto" />
          )}
        </div>
      )}
    </div>
  );
};

export default MediaInput;
