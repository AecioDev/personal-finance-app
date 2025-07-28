"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SimpleTooltipProps {
  label: React.ReactNode;
  children: React.ReactNode;
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  variant?: "block" | "text";
}

export function SimpleTooltip({
  label,
  children,
  delayDuration = 200,
  side,
  align,
  className,
  variant = "block",
}: SimpleTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            variant === "text"
              ? "bg-transparent border-none text-foreground shadow-none p-0"
              : "",
            className
          )}
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
