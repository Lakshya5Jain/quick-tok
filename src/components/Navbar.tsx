
import React from "react";
import { motion } from "framer-motion";
import { FilmIcon, VideoIcon, HomeIcon } from "lucide-react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  activeTab: "generate" | "videos";
  onTabChange: (tab: "generate" | "videos") => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <Logo size="md" onClick={() => navigate("/")} />
      
      <div className="flex items-center gap-4">
        <div className="bg-zinc-800 p-1 rounded-lg flex">
          <motion.button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === "generate" ? "bg-quicktok-orange text-white" : "text-gray-300 hover:text-white"
            }`}
            onClick={() => onTabChange("generate")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FilmIcon className="w-4 h-4" />
            <span>Create</span>
          </motion.button>
          
          <motion.button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === "videos" ? "bg-quicktok-orange text-white" : "text-gray-300 hover:text-white"
            }`}
            onClick={() => onTabChange("videos")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <VideoIcon className="w-4 h-4" />
            <span>My Videos</span>
          </motion.button>
        </div>
        
        <Button 
          variant="ghost" 
          className="text-gray-300 hover:text-white"
          onClick={() => navigate("/")}
        >
          <HomeIcon className="w-4 h-4 mr-2" />
          Home
        </Button>
        
        {user && (
          <Button 
            variant="ghost" 
            className="text-gray-300 hover:text-white"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
