import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "image/jpeg", 
    "image/jpg", 
    "image/png", 
    "video/mp4"
  ];

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    
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

  const validateFileType = (selectedFile: File): boolean => {
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error(`File type not allowed. Please upload JPEG, JPG, PNG, or MP4 files only.`);
      return false;
    }
    return true;
  };

  const uploadToSupabase = async (selectedFile: File) => {
    if (!validateFileType(selectedFile)) {
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log("Attempting to upload file to Supabase bucket 'uploads':", fileName);
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error("Error uploading to Supabase:", error);
        toast.error(`Failed to upload file: ${error.message}`);
        setIsUploading(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      
      if (publicUrlData && publicUrlData.publicUrl) {
        console.log("File uploaded successfully to Supabase:", publicUrlData.publicUrl);
        
        const fileWithUrl = new File([selectedFile], selectedFile.name, {
          type: selectedFile.type,
        }) as any;
        
        fileWithUrl.publicUrl = publicUrlData.publicUrl;
        
        setFile(fileWithUrl);
        onFileChange(fileWithUrl);
        toast.success("File uploaded successfully!");
      } else {
        toast.error("Failed to get public URL for uploaded file");
      }
    } catch (error) {
      console.error("Unexpected error during upload:", error);
      toast.error("An unexpected error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log("File selected:", selectedFile.name);
      
      uploadToSupabase(selectedFile);
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
      
      uploadToSupabase(droppedFile);
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

  const getAcceptFormats = () => {
    return accept
      .replace(/image\/jpeg,image\/jpg,image\/png,video\/mp4/g, "JPEG, JPG, PNG, MP4")
      .replace(/image\/jpeg,image\/jpg,image\/png/g, "JPEG, JPG, PNG")
      .replace(/video\/mp4/g, "MP4")
      .replace(/image\/\*/g, "Images");
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
            Accepts {getAcceptFormats()}
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-zinc-700 hover:border-quicktok-orange transition-colors">
          {isUploading ? (
            <div className="w-full h-40 flex flex-col items-center justify-center bg-zinc-800">
              <Loader2 className="h-8 w-8 text-quicktok-orange animate-spin mb-2" />
              <p className="text-center text-gray-300">Uploading...</p>
            </div>
          ) : preview ? (
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
