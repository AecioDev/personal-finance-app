"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { AnimatedTabs } from "../ui/animated-tabs";
import { usePalette } from "./palette-provider";

// Definindo o tipo Palette aqui para garantir a segurança
type Palette = "green" | "blue" | "orange" | "purple";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();

  // Tipando o nosso array de cores
  const colorOptions: { name: Palette; color: string }[] = [
    { name: "green", color: "bg-emerald-500" },
    { name: "blue", color: "bg-sky-500" },
    { name: "orange", color: "bg-orange-500" },
    { name: "purple", color: "bg-violet-500" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Paleta de Cores
        </label>
        <div className="flex items-center justify-around pt-2">
          {colorOptions.map((c) => (
            <button
              key={c.name}
              // Agora c.name é do tipo Palette, e o erro some!
              onClick={() => setPalette(c.name)}
              className={cn(
                "h-10 w-10 rounded-full transition-transform hover:scale-110",
                c.color,
                palette === c.name &&
                  "ring-2 ring-offset-2 ring-ring ring-offset-background"
              )}
              aria-label={`Mudar para o tema ${c.name}`}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Modo
        </label>
        <div className="pt-2">
          <AnimatedTabs
            defaultValue={theme || "system"}
            onValueChange={(value) => setTheme(value)}
            tabs={[
              { label: "Claro", value: "light" },
              { label: "Escuro", value: "dark" },
              { label: "Sistema", value: "system" },
            ]}
            layoutId="theme-mode-tabs"
          />
        </div>
      </div>
    </div>
  );
}
