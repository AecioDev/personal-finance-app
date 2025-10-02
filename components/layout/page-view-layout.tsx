"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface PageViewLayoutProps {
  title: string;
  children: React.ReactNode;
  bgImage?: string;
  subtitle?: string;
}

export function PageViewLayout({
  title,
  children,
  bgImage,
  subtitle,
}: PageViewLayoutProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length <= 2) {
      router.push("/dashboard");
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-primary">
      <div className="relative flex h-56 flex-col text-primary-foreground overflow-hidden">
        {bgImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image
              src={bgImage}
              alt=""
              width={144}
              height={144}
              style={{ opacity: 0.5 }}
            />
          </div>
        )}

        {/* Botão de Voltar com z-index maior */}
        <div className="relative z-20 flex-shrink-0 p-4">
          <Icon
            icon="mdi:arrow-left"
            onClick={handleGoBack}
            className="h-6 w-6 cursor-pointer transition-opacity hover:opacity-80"
          />
        </div>

        {/* Título e Subtítulo */}
        <div className="relative z-10 flex flex-grow flex-col items-center justify-center -mt-14 text-center">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="text-lg opacity-80 mt-1">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-4 rounded-t-[2.5rem] bg-background p-4">
        {children}
      </div>
    </div>
  );
}
