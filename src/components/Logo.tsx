
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
    sm: "h-16",
    md: "h-28",
    lg: "h-36",
    xl: "h-44"
  };

  return (
    <div className={`flex flex-col items-center ${className} cursor-pointer`} onClick={onClick}>
      <img 
        src="/lovable-uploads/a3b0fd8d-2a0b-4b7b-be7a-4353feca61c0.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
