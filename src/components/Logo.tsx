
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
  // Updated size values to make the logo larger
  const sizeClasses = {
    sm: "h-28", // Increased from h-20
    md: "h-44", // Increased from h-36
    lg: "h-56", // Increased from h-48
    xl: "h-72"  // Increased from h-64
  };

  return (
    <div className={`flex flex-col items-center ${className} cursor-pointer`} onClick={onClick}>
      <img 
        src="/lovable-uploads/641e5021-6609-45d8-9c70-8c6359ac6089.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
