
import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  showText = true,
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-24"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/a3b0fd8d-2a0b-4b7b-be7a-4353feca61c0.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]} orange-glow`}
      />
      {showText && (
        <span className="text-quicktok-white font-display font-bold text-2xl ml-2">
          Quick-Tok
        </span>
      )}
    </div>
  );
};

export default Logo;
