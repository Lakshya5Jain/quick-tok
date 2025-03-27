
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
    sm: "h-28",
    md: "h-44",
    lg: "h-56",
    xl: "h-72"
  };

  return (
    <div className={`flex flex-col items-center ${className} cursor-pointer`} onClick={onClick}>
      <img 
        src="/lovable-uploads/e1854fe7-b207-42fc-8841-a35599adc678.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
