"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { usePalette } from "./palette-provider"; // Certifique-se que o caminho está correto
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // Hook para controlar a paleta de cores (green, blue)
  const { setPalette } = usePalette();

  // Hook para controlar o modo (light, dark, system)
  const { setTheme, theme } = useTheme();

  // Função para alternar entre os modos de tema
  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // Função para obter o ícone correspondente ao tema atual
  const getThemeIcon = () => {
    if (theme === "light") return "material-symbols:light-mode-outline";
    if (theme === "dark") return "material-symbols:dark-mode-outline";
    return "material-symbols:desktop-windows-outline";
  };

  // Função para obter o texto correspondente ao tema atual
  const getThemeText = () => {
    if (theme === "light") return "Claro";
    if (theme === "dark") return "Escuro";
    return "Sistema";
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {/* Seção para troca de Paleta de Cores */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Paleta de Cores
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPalette("green")}
            aria-label="Mudar para paleta verde"
            className="flex-1"
          >
            <div className="mr-2 h-4 w-4 rounded-full bg-[#00D09E]" />
            Verde
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPalette("blue")}
            aria-label="Mudar para paleta azul"
            className="flex-1"
          >
            <div className="mr-2 h-4 w-4 rounded-full bg-[#0068FF]" />
            Azul
          </Button>
        </div>
      </div>

      {/* Seção para troca de Modo (Claro/Escuro) */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Modo de Exibição
        </p>
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={toggleTheme}
        >
          <Icon icon={getThemeIcon()} className="mr-2 h-5 w-5" />
          <span>Modo {getThemeText()}</span>
        </Button>
      </div>
    </div>
  );
}
