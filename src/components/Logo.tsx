
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
    sm: "h-10",
    md: "h-16",
    lg: "h-24",
    xl: "h-32"
  };

  return (
    <div className={`flex flex-col items-center ${className} cursor-pointer`} onClick={onClick}>
      <img 
        src="/lovable-uploads/337fb8c9-c82c-4cec-820f-c94d6aee22da.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
