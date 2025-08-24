// src/app/layout.tsx
import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { FinanceProvider } from "@/components/providers/finance-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PaletteProvider } from "@/components/theme/palette-provider"; // 1. Importamos o novo provedor
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { ModalProvider } from "@/components/providers/modal-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Controle Financeiro",
  description: "Sistema de controle de contas pessoais",
  manifest: "/manifest.json",
  generator: "v0.dev",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00D09E", // Atualizei para a cor primária do tema verde
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Controle Financeiro" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
      </head>
      <body className={inter.className}>
        {/* 2. Envolvemos tudo com o PaletteProvider */}
        <PaletteProvider defaultPalette="green" storageKey="app-palette">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ModalProvider>
              <AuthProvider>
                <FinanceProvider>
                  <ToastContainer />
                  {children}
                </FinanceProvider>
              </AuthProvider>
            </ModalProvider>
          </ThemeProvider>
        </PaletteProvider>
      </body>
    </html>
  );
}
