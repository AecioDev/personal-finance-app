"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "../providers/auth-provider";
import { Button } from "../ui/button";

interface SidebarProps {
  onLinkClick?: () => void;
}

export function Sidebar({ onLinkClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navItems = [
    { name: "Início", href: "/", icon: "mdi:home" },
    { name: "Dívidas", href: "/debts", icon: "mdi:credit-card-off" },
    { name: "Contas Bancárias", href: "/accounts", icon: "mdi:bank" },
    {
      name: "Formas de Pagamento",
      href: "/payment-methods",
      icon: "mdi:credit-card-multiple",
    },
    { name: "Relatórios", href: "/reports", icon: "mdi:chart-bar" },
    { name: "Perfil", href: "/profile", icon: "mdi:account-circle" },
    //{ name: "Lançar", href: "/new-transaction", icon: "mdi:plus-circle" },
  ];

  return (
    <nav className="flex flex-col gap-2 p-4 h-full">
      <div className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
              pathname === item.href
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-foreground hover:text-primary"
            )}
          >
            <Icon icon={item.icon} className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-muted-foreground/20 flex flex-col gap-2">
        <ThemeToggle />
        <Button
          variant="destructive"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <Icon icon="mdi:logout" className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </nav>
  );
}
