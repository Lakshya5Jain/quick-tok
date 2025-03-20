
import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  status: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative pt-1">
        <div className="text-center mb-2 text-sm font-medium text-primary">
          {status}
        </div>
        <div className="flex items-center justify-center mb-2">
          <motion.div 
            className="h-24 w-24 rounded-full border-4 border-muted flex items-center justify-center text-xl font-bold text-primary relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
              animate={{ 
                rotate: progress * 3.6,
              }}
              style={{
                transformOrigin: "center",
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {`${progress}%`}
          </motion.div>
        </div>

        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-muted">
          <motion.div 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
