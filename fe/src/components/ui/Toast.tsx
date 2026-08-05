"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = "success", onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-white border-green-200",
    error: "bg-white border-red-200",
    info: "bg-white border-blue-200",
  };

  return (
    <div
      className={`flex items-center p-4 border rounded-lg shadow-lg w-80 max-w-full transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${bgColors[type]}`}
    >
      <div className="flex-shrink-0 mr-3">{icons[type]}</div>
      <div className="flex-1 text-sm font-medium text-gray-800">{message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
