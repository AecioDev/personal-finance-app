"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface ButtonBackProps extends ButtonProps {
  children?: React.ReactNode;
  icon?: string;
}

export const ButtonBack = React.forwardRef<HTMLButtonElement, ButtonBackProps>(
  ({ className, children, icon = "mdi:arrow-left", ...props }, ref) => {
    return (
      <Button
        variant="outline"
        className={cn(
          "bg-muted hover:bg-muted-foreground/10 text-muted-foreground md:bg-transparent md:hover:bg-muted",
          "p-2 sm:px-4 sm:py-2", // ALTERADO: Padding maior a partir de sm
          "w-fit",
          className
        )}
        ref={ref}
        {...props}
      >
        <Icon icon={icon} className="h-8 w-8 sm:mr-2" />
        <span className="hidden sm:inline">{children || "Voltar"}</span>
      </Button>
    );
  }
);
ButtonBack.displayName = "ButtonBack";
