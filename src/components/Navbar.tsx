
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavbarProps {
  activeTab: "generate" | "videos";
  onTabChange: (tab: "generate" | "videos") => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="w-full max-w-2xl mx-auto mt-8 mb-6">
      <div className="flex justify-center relative border-b border-gray-200">
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
            className="absolute bottom-0 h-0.5 bg-primary rounded-full"
            initial={false}
            animate={{ 
              left: activeTab === "generate" ? "25%" : "75%",
              right: activeTab === "generate" ? "50%" : "25%",
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
        "relative py-4 px-8 text-sm font-medium transition-colors duration-300 outline-none",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
};

export default Navbar;
