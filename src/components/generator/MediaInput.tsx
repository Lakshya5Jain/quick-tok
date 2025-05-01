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
  tabOptions?: string[];
  tabLabel?: string;
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
  defaultUrl,
  tabOptions,
  tabLabel
}) => {
  const options = tabOptions || [
    // Default to old character images if not provided
    "https://pbs.twimg.com/media/ElHEwVHXUAEtiwR.jpg",
    "https://images.jacobinmag.com/wp-content/uploads/2019/08/08095230/Bernie_Sanders_Joe_Rogan_c0-0-1361-794_s1770x1032.jpg",
    "https://www.politico.com/dims4/default/ce646c6/2147483647/strip/true/crop/4896x3262+0+0/resize/630x420!/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F5c%2Fb9%2Ff02c0a8640bc91152fc324227208%2Felection-2024-debate-65361.jpg",
    "https://i.abcnewsfe.com/a/030dec16-260c-4be0-8fe6-28b41c06bb36/donald-trump-9-gty-gmh-250313_1741885130014_hpMain.jpg",
    "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/3E0B/production/_109238851_lebron.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4a/Alexandria_Ocasio-Cortez_Official_Portrait.jpg",
    "https://platform.vox.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/23966471/Screen_Shot_2022_08_23_at_4.22.21_PM.png?quality=90&strip=all&crop=11.536561264822,0,76.926877470356,100",
    "https://www.hollywoodreporter.com/wp-content/uploads/2024/03/Syndey-Sweeney-SNL-screenshot-H-2024.jpg?w=1296&h=730&crop=1",
    // Add new character images
    "https://image.cnbcfm.com/api/v1/image/107293744-1693398435735-elon.jpg?v=1738327797",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/330px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"
  ];
  const [tab, setTab] = useState("character");
  const [selectedOption, setSelectedOption] = useState<string>(() => {
    const idx = Math.floor(Math.random() * options.length);
    return options[idx];
  });

  useEffect(() => {
    // Ensure parent knows which input type is active
    if (tab === "file") {
      onToggleUseFile(true);
    } else {
      // For both URL and preset character options we don't rely on a user-uploaded file
      onToggleUseFile(false);
    }

    if (tab === "file") {
      if (selectedFile) {
        onMediaAvailable(true, URL.createObjectURL(selectedFile));
      } else {
        // If no file uploaded, keep using the selected option
        onMediaAvailable(true, selectedOption);
      }
    } else if (tab === "url") {
      onMediaAvailable(!!url, url);
    } else if (tab === "character") {
      onFileChange(null);
      onUrlChange(selectedOption);
      onMediaAvailable(true, selectedOption);
    }
    return () => {
      if (tab === "file" && selectedFile) {
        URL.revokeObjectURL(URL.createObjectURL(selectedFile));
      }
    };
  }, [tab, selectedFile, url, selectedOption, onMediaAvailable, onToggleUseFile]);

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
          value={tab}
          onValueChange={setTab}
          className="w-full"
        >
          <TabsList className="w-full bg-zinc-800 border-zinc-700">
            <TabsTrigger 
              value="character" 
              className="flex-1 data-[state=active]:bg-quicktok-orange data-[state=active]:text-white"
            >
              {tabLabel || "Choose Character"}
            </TabsTrigger>
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

      {tab === "file" ? (
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
      ) : tab === "url" ? (
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
      ) : (
        <div className="flex flex-row gap-3 mt-2 overflow-x-auto">
          {options.map((img, idx) => (
            <button
              key={img}
              type="button"
              className={`rounded-lg border-2 p-1 transition-all ${
                selectedOption === img ? "border-quicktok-orange ring-2 ring-quicktok-orange" : "border-zinc-700"
              }`}
              onClick={() => setSelectedOption(img)}
              aria-label={`Select option ${idx + 1}`}
            >
              {img.endsWith('.mp4') ? (
                <video src={img} className="w-16 h-16 object-cover rounded-md" autoPlay muted loop playsInline />
              ) : img === '/logo.svg' ? (
                <img src={img} alt="QuickTok logo" className="w-16 h-16 object-cover rounded-md bg-white border border-zinc-300" />
              ) : (
                <img src={img} alt="option" className="w-16 h-16 object-cover rounded-md" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaInput;
