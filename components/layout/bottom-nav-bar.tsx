"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

// ... (seu array navItems continua o mesmo)
const navItems = [
  {
    type: "link",
    href: "/dashboard",
    icon: "mdi:home-variant",
    label: "Início",
  },
  {
    type: "link",
    href: "/debts",
    icon: "mdi:credit-card-off",
    label: "Dívidas",
  },
  { type: "action" },
  {
    type: "link",
    href: "/reports",
    icon: "mdi:chart-bar",
    label: "Relatórios",
  },
  { type: "menu", icon: "mdi:cog-outline", label: "Cadastros" },
];

export function BottomNavBar() {
  const pathname = usePathname();
  // Pegando as ações padrão e as customizadas do nosso provider
  const { openNewExpense, openNewTransaction, customActions } = useModal();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-muted border-t rounded-2xl z-50">
      <nav className="grid grid-cols-5 items-center h-full">
        {navItems.map((item, index) => {
          if (item.type === "action") {
            return (
              <div key="actions-button" className="-mt-8 flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                    >
                      <Icon icon="mdi:plus" className="h-8 w-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="center"
                    className="mb-2 bg-surface"
                  >
                    {/* =================== LÓGICA CONTEXTUAL AQUI =================== */}
                    {customActions.length > 0 ? (
                      // Se existem ações customizadas, mostra elas
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
                      // Se não, mostra as ações padrão
                      <>
                        <DropdownMenuItem
                          onClick={openNewExpense}
                          className="py-3 px-4 text-base"
                        >
                          <Icon
                            icon="mdi:trending-down"
                            className="mr-3 h-5 w-5"
                          />
                          <span>Nova Despesa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={openNewTransaction}
                          className="py-3 px-4 text-base"
                        >
                          <Icon icon="mdi:cash-plus" className="mr-3 h-5 w-5" />
                          <span>Novo Lançamento</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {/* ============================================================= */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          // ... (o resto do seu componente continua igual)
          if (item.type === "menu") {
            return (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center gap-1 text-secondary-foreground transition-colors">
                    <Icon icon={item.icon || "mdi:check"} className="h-6 w-6" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="mb-2">
                  {/* Itens do menu de Cadastros aumentados */}
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
