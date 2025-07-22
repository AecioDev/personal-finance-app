"use client";

import React from "react";
import { toast as reactToastify, ToastOptions } from "react-toastify";

interface CustomToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface UseToastReturn {
  toast: (props: CustomToastProps) => void;
}

export function useToast(): UseToastReturn {
  const toast = ({
    title,
    description,
    variant = "default",
    duration = 1500,
  }: CustomToastProps) => {
    const options: ToastOptions = {
      position: "top-right",
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    };

    const message = (
      <div>
        {title && <div style={{ fontWeight: "bold" }}>{title}</div>}
        {description && <div>{description}</div>}
        {!title && !description && "Mensagem de toast"}
      </div>
    );

    switch (variant) {
      case "destructive":
        reactToastify.error(message, options);
        break;
      case "success":
        reactToastify.success(message, options);
        break;
      default:
        reactToastify.info(message, options);
        break;
    }
  };

  return { toast };
}
