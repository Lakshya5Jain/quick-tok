import React from "react";
import { motion } from "framer-motion";
import { FilmIcon, VideoIcon, CreditCard, LayoutDashboard, Sparkles } from "lucide-react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCredits } from "@/context/CreditsContext";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  activeTab: "generate" | "videos" | "dashboard" | "subscription";
  onTabChange: (tab: "generate" | "videos" | "dashboard" | "subscription") => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { signOut, user } = useAuth();
  const { credits, subscription } = useCredits();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      {/* Left group: Logo */}
      <div className="flex items-center">
        <div onClick={() => navigate("/")} className="cursor-pointer">
          <Logo size="md" />
        </div>
      </div>
      {/* Right group: Credits, Nav bar buttons, and Sign Out */}
      <div className="flex items-center gap-4">
        {credits !== null && (
          <div className="flex items-center text-quicktok-orange">
            <Sparkles className="w-5 h-5" />
            <span className="ml-1 font-medium">{credits}</span>
          </div>
        )}
        <div className="bg-zinc-800 p-1 rounded-lg flex items-center">
          <motion.button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === "generate" ? "bg-quicktok-orange text-white" : "text-gray-300 hover:text-white"
            }`}
            onClick={() => navigate("/create")}
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
            onClick={() => navigate("/videos")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <VideoIcon className="w-4 h-4" />
            <span>My Videos</span>
          </motion.button>
          <motion.button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === "dashboard" ? "bg-quicktok-orange text-white" : "text-gray-300 hover:text-white"
            }`}
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </motion.button>
          <motion.button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === "subscription" ? "bg-quicktok-orange text-white" : "text-gray-300 hover:text-white"
            }`}
            onClick={() => navigate("/subscription")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <CreditCard className="w-4 h-4" />
            <span>Subscriptions</span>
          </motion.button>
        </div>
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
