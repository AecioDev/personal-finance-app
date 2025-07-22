"use client";

import React, { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@iconify/react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onMenuToggle={() => setIsSheetOpen(true)} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        {/* Adicionado flex flex-col e h-full aqui */}
        <SheetContent
          side="left"
          className="w-64 sm:w-72 overflow-y-auto flex flex-col h-full"
        >
          <SheetHeader>
            <SheetTitle className="mt-4">Personal Finance App</SheetTitle>
            <SheetDescription>Seu dinheiro, sob controle.</SheetDescription>
            <div className="flex justify-center mt-2">
              <Icon
                icon="material-icon-theme:jenkins"
                className="h-8 w-8 text-primary"
              />
            </div>
          </SheetHeader>
          {/* Sidebar agora vai preencher o espaço restante */}
          <Sidebar onLinkClick={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <Footer />
    </div>
  );
}
