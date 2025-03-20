
import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  showText = false,
  size = "md",
  onClick
}) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-24"
  };

  return (
    <div className={`flex items-center ${className} cursor-pointer`} onClick={onClick}>
      <img 
        src="/lovable-uploads/cd0f424d-1fb6-4bc5-9e9a-6e87d9f82bdb.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]}`}
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
