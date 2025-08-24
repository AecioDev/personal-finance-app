import type React from "react";
import { BottomNavBar } from "./bottom-nav-bar";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* O padding-bottom (pb-24) é crucial para o conteúdo não ficar escondido atrás da navbar */}
      <main className="pb-24">{children}</main>
      <BottomNavBar />
    </div>
  );
}
