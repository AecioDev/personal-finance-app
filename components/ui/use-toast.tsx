// in: components/ui/use-toast.tsx (VERSÃO ATUALIZADA)

"use client";

import React from "react";
import {
  toast as reactToastify,
  ToastOptions,
  Id,
  UpdateOptions,
} from "react-toastify";
import { cn } from "@/lib/utils"; // Importamos o cn para mesclar classes

interface CustomToastProps {
  id?: Id;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
  className?: string; // <-- A NOVA PROPRIEDADE MÁGICA
}

interface UseToastReturn {
  toast: (props: CustomToastProps) => Id;
  dismiss: (id?: Id) => void;
}

export function useToast(): UseToastReturn {
  const toast = ({
    id,
    title,
    description,
    variant = "default",
    duration = 5000,
    className, // <-- Pegamos a nova propriedade
  }: CustomToastProps): Id => {
    const message = (
      <div>
        {title && <div style={{ fontWeight: "bold" }}>{title}</div>}
        {description && <div>{description}</div>}
        {!title && !description && "Mensagem de toast"}
      </div>
    );

    const baseOptions: ToastOptions = {
      position: "top-right",
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      className: cn("text-white", className), // <-- E APLICAMOS ELA AQUI!
    };

    if (id) {
      const updateOptions: UpdateOptions = {
        ...baseOptions,
        render: message,
      };
      reactToastify.update(id, updateOptions);
      return id;
    }

    switch (variant) {
      case "destructive":
        return reactToastify.error(message, baseOptions);
      case "success":
        // Para o 'success', podemos definir uma cor padrão se nenhuma for passada
        baseOptions.className = cn("bg-green-600 text-white", className);
        return reactToastify.success(message, baseOptions);
      default:
        return reactToastify.info(message, baseOptions);
    }
  };

  const dismiss = (id?: Id) => {
    reactToastify.dismiss(id);
  };

  return { toast, dismiss };
}
