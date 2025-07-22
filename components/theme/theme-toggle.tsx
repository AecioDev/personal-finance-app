// src/components/theme-toggle.tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getThemeIcon = () => {
    if (theme === "light") {
      return "material-symbols:light-mode-outline";
    } else if (theme === "dark") {
      return "material-symbols:dark-mode-outline";
    }
    return "material-symbols:desktop-windows-outline";
  };

  const getThemeText = () => {
    if (theme === "light") {
      return "Modo Claro";
    } else if (theme === "dark") {
      return "Modo Escuro";
    }
    return "Modo Sistema";
  };

  return (
    <Button
      variant="outline"
      className="w-full justify-start bg-transparent"
      onClick={toggleTheme}
    >
      <Icon icon={getThemeIcon()} className="w-5 h-5 mr-3" />
      {getThemeText()}
    </Button>
  );
}
