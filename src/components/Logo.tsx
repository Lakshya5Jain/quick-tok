
import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  showText = true,
  size = "md",
  onClick
}) => {
  const sizeClasses = {
    sm: "h-20",
    md: "h-36",
    lg: "h-48",
    xl: "h-64"
  };

  return (
    <div className={`flex flex-col items-center ${className} cursor-pointer`} onClick={onClick}>
      <img 
        src="/lovable-uploads/cd0f424d-1fb6-4bc5-9e9a-6e87d9f82bdb.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
