
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

interface NavbarProps {
  activeTab: "generate" | "videos";
  onTabChange: (tab: "generate" | "videos") => void;
  onLogoClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onLogoClick }) => {
  return (
    <nav className="w-full max-w-4xl mx-auto mb-6 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex justify-center sm:justify-start">
        <Logo
          className="cursor-pointer"
          size="md"
          onClick={onLogoClick}
        />
      </div>
      
      <div className="flex justify-center relative border-b border-zinc-800">
        <div className="w-full flex justify-center">
          <TabButton 
            active={activeTab === "generate"} 
            onClick={() => onTabChange("generate")}
          >
            Generate Video
          </TabButton>
          <TabButton 
            active={activeTab === "videos"} 
            onClick={() => onTabChange("videos")}
          >
            Past Videos
          </TabButton>
          
          {/* Active tab indicator */}
          <motion.div 
            className="absolute bottom-0 h-0.5 bg-quicktok-orange rounded-full"
            initial={false}
            animate={{ 
              width: '50%',
              left: activeTab === "generate" ? "0%" : "50%",
              x: 0
            }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          />
        </div>
      </div>
    </nav>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative py-4 px-8 text-sm font-medium transition-colors duration-300 outline-none w-1/2",
        active ? "text-quicktok-orange" : "text-gray-400 hover:text-gray-200"
      )}
    >
      {children}
    </button>
  );
};

export default Navbar;
