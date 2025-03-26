
import React from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  
  // Significantly increased size values to make the logo larger
  const sizeClasses = {
    sm: "h-36", // Increased from h-28
    md: "h-56", // Increased from h-44
    lg: "h-72", // Increased from h-56
    xl: "h-96"  // Increased from h-72
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/");
    }
  };

  return (
    <div className={`flex flex-col items-center ${className} cursor-pointer`} onClick={handleClick}>
      <img 
        src="/lovable-uploads/e1854fe7-b207-42fc-8841-a35599adc678.png" 
        alt="Quick-Tok Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
