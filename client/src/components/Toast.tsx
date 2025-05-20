import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  isVisible: boolean;
  onHide: () => void;
}

export default function Toast({ 
  message, 
  type = "success", 
  duration = 3000, 
  isVisible, 
  onHide 
}: ToastProps) {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsHiding(true);
        setTimeout(() => {
          setIsHiding(false);
          onHide();
        }, 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onHide]);

  if (!isVisible && !isHiding) return null;

  const bgColorClass = {
    success: "bg-accent",
    error: "bg-error",
    info: "bg-accent/80"
  }[type];

  const iconClass = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    info: "fa-info-circle"
  }[type];

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center z-50 text-white transform transition-all duration-300",
        bgColorClass,
        isVisible && !isHiding ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
      )}
    >
      <i className={`fas ${iconClass} mr-2`}></i>
      <span>{message}</span>
    </div>
  );
}
