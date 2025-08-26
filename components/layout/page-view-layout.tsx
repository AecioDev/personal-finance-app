"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

// A interface define que o componente precisa de um título e do conteúdo (children)
interface PageViewLayoutProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Um template de layout padrão para páginas internas, seguindo o design do Figma.
 * @param title O título a ser exibido no cabeçalho.
 * @param children O conteúdo da página que será renderizado dentro do container branco.
 */
export function PageViewLayout({ title, children }: PageViewLayoutProps) {
  const router = useRouter();

  return (
    <div className="bg-primary">
      {/* Cabeçalho Verde Padrão */}
      <div className="flex h-56 flex-col text-primary-foreground">
        {/* Linha superior apenas com o botão de voltar */}
        <div className="flex-shrink-0 p-4">
          <Icon
            icon="mdi:arrow-left"
            onClick={() => router.back()}
            className="h-6 w-6 cursor-pointer transition-opacity hover:opacity-80"
          />
        </div>
        {/* Container do título para centralização perfeita */}
        <div className="flex flex-grow items-center justify-center -mt-14">
          <h1 className="text-3xl font-semibold">{title}</h1>
        </div>
      </div>

      {/* Container Branco Curvado com margem negativa para sobrepor */}
      <div className="space-y-4 rounded-t-[2.5rem] bg-background p-4">
        {/* O conteúdo da sua página será renderizado aqui dentro */}
        {children}
      </div>
    </div>
  );
}
