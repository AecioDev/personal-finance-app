"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface ButtonNewProps extends ButtonProps {
  children?: React.ReactNode;
  icon?: string;
}

export const ButtonNew = React.forwardRef<HTMLButtonElement, ButtonNewProps>(
  ({ className, children, icon = "mdi:plus", ...props }, ref) => {
    return (
      <Button
        className={cn(
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "p-2 sm:px-4 sm:py-2",
          "w-fit",
          className
        )}
        ref={ref}
        {...props}
      >
        <Icon icon={icon} className="h-8 w-8 sm:mr-2" />
        <span className="hidden sm:inline">{children || "Novo"}</span>
      </Button>
    );
  }
);
ButtonNew.displayName = "ButtonNew";
