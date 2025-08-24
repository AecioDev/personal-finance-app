"use client";

import React from "react";
import { BottomNavBar } from "./bottom-nav-bar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">{children}</main>
      <BottomNavBar />
    </div>
  );
}
