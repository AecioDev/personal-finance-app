"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes"; // 1. IMPORTAMOS O HOOK DE TEMA
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useModal } from "@/components/providers/modal-provider";
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
    href: "/extrato",
    icon: "mdi:format-list-bulleted-square",
    label: "Extrato",
  },
  { type: "action" },
  { type: "theme-toggle" }, // 2. SUBSTITUÍMOS O ITEM VAZIO
  { type: "menu", icon: "mdi:cog-outline", label: "Cadastros" },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const {
    openNewExpenseModal,
    openNewIncomeModal,
    openCategoryManager,
    customActions,
  } = useModal();

  // 3. INICIALIZAMOS O HOOK DE TEMA
  const { theme, setTheme } = useTheme();

  // Controle para evitar erro de hidratação (comum com `next-themes`)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-muted border-t rounded-2xl z-50">
      <nav className="grid grid-cols-5 items-center h-full">
        {navItems.map((item, index) => {
          if (item.type === "action") {
            // ... (código do botão de ação, sem alteração)
            return (
              <div key="actions-button" className="-mt-8 flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      className="w-16 h-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/80"
                    >
                      <Icon icon="mdi:plus" className="h-8 w-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="center"
                    className="mb-2 bg-surface"
                  >
                    {customActions.length > 0 ? (
                      customActions.map((action) => (
                        <DropdownMenuItem
                          key={action.label}
                          onClick={action.action}
                          className="py-3 px-4 text-base"
                        >
                          <Icon icon={action.icon} className="mr-3 h-5 w-5" />
                          <span>{action.label}</span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={openNewExpenseModal}
                          className="py-3 px-4 text-base"
                        >
                          <Icon
                            icon="mdi:trending-down"
                            className="mr-3 h-5 w-5"
                          />
                          <span>Nova Despesa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={openNewIncomeModal}
                          className="py-3 px-4 text-base"
                        >
                          <Icon icon="mdi:cash-plus" className="mr-3 h-5 w-5" />
                          <span>Novo Receita</span>
                        </DropdownMenuItem>
                      </>
                    )}
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
                  <button className="flex flex-col items-center justify-center gap-1 text-secondary-foreground transition-colors">
                    <Icon icon={item.icon || "mdi:check"} className="h-6 w-6" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="mb-2">
                  <DropdownMenuItem asChild className="py-3 px-4 text-base">
                    <Link href="/accounts">
                      <Icon icon="mdi:bank-outline" className="mr-3 h-5 w-5" />
                      <span>Contas Bancárias</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-3 px-4 text-base">
                    <Link href="/payment-methods">
                      <Icon
                        icon="mdi:credit-card-multiple-outline"
                        className="mr-3 h-5 w-5"
                      />
                      <span>Formas de Pagamento</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="py-3 px-4 text-base">
                    <Link href="/categories">
                      <Icon
                        icon="mdi:tag-multiple-outline"
                        className="mr-3 h-5 w-5"
                      />
                      <span>Categorias</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="py-3 px-4 text-base">
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

          // 4. ADICIONAMOS A LÓGICA PARA RENDERIZAR NOSSO NOVO BOTÃO
          if (item.type === "theme-toggle") {
            // Se o componente ainda não montou, renderiza um placeholder para evitar piscar
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
