"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

// Array de itens de navegação atualizado
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
  { type: "action" }, // Botão central de ações
  {
    type: "link",
    href: "/reports", // <<--- AQUI A MUDANÇA
    icon: "mdi:chart-pie",
    label: "Relatórios",
  },
  { type: "menu", icon: "mdi:cog-outline", label: "Cadastros" },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hooks para novas despesas, receitas e transferências
  const handleNewExpense = () => {
    router.push("/financial-entry?type=expense");
  };

  const handleNewIncome = () => {
    router.push("/financial-entry?type=income");
  };

  const handleNewTransfer = () => {
    router.push("/financial-entry/transfer");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 pointer-events-none">
      <div className="mx-auto h-full w-full md:max-w-screen-md pointer-events-auto">
        <nav className="grid h-full w-full grid-cols-5 items-center rounded-t-2xl border-t bg-muted">
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
                        onClick={handleNewTransfer}
                        className="px-4 py-3 text-base"
                      >
                        <Icon
                          icon="mdi:swap-horizontal"
                          className="mr-3 h-5 w-5 text-blue-500"
                        />
                        <span>Nova Transferência</span>
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
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors">
                      <Icon
                        icon={item.icon || "mdi:check"}
                        className="h-6 w-6"
                      />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="mb-2">
                    <DropdownMenuItem asChild className="px-4 py-3 text-base">
                      <Link href="/accounts">
                        <Icon
                          icon="mdi:bank-outline"
                          className="mr-3 h-5 w-5"
                        />
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

            // O bloco "theme-toggle" foi removido daqui.

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
    </div>
  );
}
