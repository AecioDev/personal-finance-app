"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // 1. Importamos o useRouter
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

const navItems = [
  {
    type: "link",
    href: "/dashboard",
    icon: "mdi:home-variant",
    label: "Início",
  },
  {
    type: "link",
    href: "/extrato", // ATENÇÃO: Verifique se essa rota existe. Se não, pode ser /transactions, etc.
    icon: "mdi:format-list-bulleted-square",
    label: "Extrato",
  },
  { type: "action" },
  { type: "theme-toggle" },
  { type: "menu", icon: "mdi:cog-outline", label: "Cadastros" },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter(); // 2. Inicializamos o router
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // 3. Funções que agora navegam para a nova página
  const handleNewExpense = () => {
    router.push("/financial-entry?type=expense");
  };

  const handleNewIncome = () => {
    router.push("/financial-entry?type=income");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 rounded-2xl border-t bg-muted">
      <nav className="grid h-full grid-cols-5 items-center">
        {navItems.map((item) => {
          if (item.type === "action") {
            return (
              <div key="actions-button" className="-mt-8 flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      className="h-16 w-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/80"
                    >
                      <Icon icon="mdi:plus" className="h-8 w-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="center"
                    className="mb-2 bg-surface"
                  >
                    {/* 4. Trocamos os `onClick` para chamar nossas novas funções de navegação */}
                    <DropdownMenuItem
                      onClick={handleNewExpense}
                      className="px-4 py-3 text-base"
                    >
                      <Icon
                        icon="mdi:trending-down"
                        className="mr-3 h-5 w-5 text-destructive"
                      />
                      <span>Nova Despesa</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleNewIncome}
                      className="px-4 py-3 text-base"
                    >
                      <Icon
                        icon="mdi:cash-plus"
                        className="mr-3 h-5 w-5 text-green-500"
                      />
                      <span>Nova Receita</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          if (item.type === "menu") {
            // ... (código do menu de cadastros, sem alteração)
            return (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors">
                    <Icon icon={item.icon || "mdi:check"} className="h-6 w-6" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="mb-2">
                  <DropdownMenuItem asChild className="px-4 py-3 text-base">
                    <Link href="/accounts">
                      <Icon icon="mdi:bank-outline" className="mr-3 h-5 w-5" />
                      <span>Contas</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-4 py-3 text-base">
                    <Link href="/payment-methods">
                      <Icon
                        icon="mdi:credit-card-multiple-outline"
                        className="mr-3 h-5 w-5"
                      />
                      <span>Formas de Pag.</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="px-4 py-3 text-base">
                    <Link href="/categories">
                      <Icon
                        icon="mdi:tag-multiple-outline"
                        className="mr-3 h-5 w-5"
                      />
                      <span>Categorias</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="px-4 py-3 text-base">
                    <Link href="/profile">
                      <Icon
                        icon="mdi:account-circle-outline"
                        className="mr-3 h-5 w-5"
                      />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          if (item.type === "theme-toggle") {
            if (!mounted) return <div key="theme-toggle-placeholder" />;

            return (
              <button
                key="theme-toggle"
                onClick={toggleTheme}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors"
              >
                <Icon
                  icon={
                    theme === "light"
                      ? "mdi:weather-sunny"
                      : "mdi:weather-night"
                  }
                  className="h-6 w-6"
                />
                <span className="text-xs capitalize">{theme}</span>
              </button>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              href={item.href!}
              key={item.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors",
                isActive && "text-primary font-bold"
              )}
            >
              <Icon icon={item.icon!} className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
