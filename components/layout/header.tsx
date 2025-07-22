"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky py-4 mb-2 z-40 w-full border-b bg-header-footer-background shadow-sm backdrop-blur supports-[backdrop-filter]:bg-header-footer-background">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onMenuToggle}>
            <Icon icon="picon:menu" className="h-8 w-8" />
          </Button>
          <div className="mx-2">
            <h1 className="text-2xl font-bold">
              Olá, {user?.displayName?.split(" ")[0] || "Usuário"}!
            </h1>
            <p className="text-muted-foreground">
              Este é o resumo das suas finanças
            </p>
          </div>
        </div>

        <Link href="/profile">
          <img
            src={user?.photoURL || "/placeholder.svg"}
            alt={user?.displayName || "Usuário"}
            className="w-10 h-10 rounded-full cursor-pointer"
          />
        </Link>
      </div>
    </header>
  );
}
