
import React, { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  accept?: string;
  label: string;
  id: string;
  className?: string;
  initialFile?: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  accept = "image/*",
  label,
  id,
  className = "",
  initialFile = null,
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate preview when file is set initially or changed
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    
    // Create preview for images and videos
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log("File selected:", selectedFile.name);
      setFile(selectedFile);
      onFileChange(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      console.log("File dropped:", droppedFile.name);
      setFile(droppedFile);
      onFileChange(droppedFile);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      
      {!file ? (
        <div
          className={`file-drop-area rounded-lg border-2 border-dashed border-zinc-700 p-6 text-center cursor-pointer hover:border-quicktok-orange transition-colors ${isDragging ? "border-quicktok-orange bg-zinc-800" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-quicktok-orange mb-4" />
          <p className="text-gray-300">
            Click or drag and drop to upload
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Accepts {accept.replace(/,/g, ", ")}
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-zinc-700 hover:border-quicktok-orange transition-colors">
          {preview ? (
            file.type.startsWith("video/") ? (
              <video 
                src={preview} 
                className="w-full h-40 object-cover"
                controls
                muted
              />
            ) : (
              <img 
                src={preview} 
                alt="File preview" 
                className="w-full h-40 object-cover"
              />
            )
          ) : (
            <div className="w-full h-40 flex items-center justify-center bg-zinc-800">
              <p className="text-center text-gray-300 p-4 break-all">
                {file.name}
              </p>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-quicktok-orange transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <input
        type="file"
        id={id}
        accept={accept}
        onChange={handleFileChange}
        ref={inputRef}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
