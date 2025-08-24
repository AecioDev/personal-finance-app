"use client";

import * as React from "react";

// Define os nomes dos temas que criamos no CSS
type Palette = "green" | "blue";

type PaletteProviderProps = {
  children: React.ReactNode;
  defaultPalette?: Palette;
  storageKey?: string;
};

type PaletteProviderState = {
  palette: Palette;
  setPalette: (palette: Palette) => void;
};

const initialState: PaletteProviderState = {
  palette: "green", // Tema padrão
  setPalette: () => null,
};

const PaletteProviderContext =
  React.createContext<PaletteProviderState>(initialState);

export function PaletteProvider({
  children,
  defaultPalette = "green",
  storageKey = "app-palette",
  ...props
}: PaletteProviderProps) {
  // 1. Inicializamos o estado APENAS com o valor padrão.
  //    Isso garante que o código funcione no servidor.
  const [palette, setPalette] = React.useState<Palette>(defaultPalette);

  // 2. Usamos o useEffect para acessar o localStorage com segurança.
  //    Este hook só roda no NAVEGADOR, após a primeira renderização.
  React.useEffect(() => {
    const storedPalette = window.localStorage.getItem(
      storageKey
    ) as Palette | null;
    if (storedPalette) {
      setPalette(storedPalette);
    }
    // O array vazio [] significa que este efeito só roda uma vez, quando o componente monta.
  }, [storageKey]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.removeAttribute("data-theme");
    root.setAttribute("data-theme", palette);
  }, [palette]);

  const value = {
    palette,
    setPalette: (palette: Palette) => {
      // 3. A lógica para salvar a escolha do usuário continua a mesma.
      window.localStorage.setItem(storageKey, palette);
      setPalette(palette);
    },
  };

  return (
    <PaletteProviderContext.Provider {...props} value={value}>
      {children}
    </PaletteProviderContext.Provider>
  );
}

// Hook customizado para usar o provedor facilmente
export const usePalette = () => {
  const context = React.useContext(PaletteProviderContext);

  if (context === undefined)
    throw new Error("usePalette must be used within a PaletteProvider");

  return context;
};
