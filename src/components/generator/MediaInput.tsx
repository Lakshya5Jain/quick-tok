
import React, { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";

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
}) => {
  // State to track file preview URL
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  
  // Create or update preview URL when file changes
  useEffect(() => {
    if (selectedFile) {
      // Revoke previous object URL to prevent memory leaks
      if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      
      // Create new object URL for preview
      const newPreviewUrl = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(newPreviewUrl);
      
      // Notify parent about available media
      if (onMediaAvailable) {
        onMediaAvailable(true, newPreviewUrl);
      }
      
      // Clean up object URL when component unmounts
      return () => {
        if (newPreviewUrl && newPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(newPreviewUrl);
        }
      };
    } else {
      setFilePreviewUrl(null);
      
      // When no file is selected, notify parent if URL is not available either
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
    
    // Notify parent about media availability after toggle
    if (onMediaAvailable) {
      if (value) {
        onMediaAvailable(!!selectedFile, filePreviewUrl);
      } else {
        onMediaAvailable(!!url, url || null);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">
        {title}
      </label>
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center">
          <input
            type="radio"
            id={`${title.replace(/\s+/g, "")}-url`}
            name={`${title.replace(/\s+/g, "")}-source`}
            checked={!useFile}
            onChange={() => handleToggleUseFile(false)}
            className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
          />
          <label htmlFor={`${title.replace(/\s+/g, "")}-url`} className="ml-2 text-sm text-gray-300">Use URL</label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id={`${title.replace(/\s+/g, "")}-file`}
            name={`${title.replace(/\s+/g, "")}-source`}
            checked={useFile}
            onChange={() => handleToggleUseFile(true)}
            className="h-4 w-4 text-quicktok-orange focus:ring-quicktok-orange"
          />
          <label htmlFor={`${title.replace(/\s+/g, "")}-file`} className="ml-2 text-sm text-gray-300">Upload File</label>
        </div>
      </div>

      {!useFile ? (
        <input
          type="url"
          id={title.replace(/\s+/g, "")}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={urlPlaceholder}
          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
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
        <p className="text-xs text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};

export default MediaInput;
