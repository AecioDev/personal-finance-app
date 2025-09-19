// components/layout/app-loader.tsx
"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";

interface AppLoaderProps {
  text: string;
}

export function AppLoader({ text }: AppLoaderProps) {
  return (
    <div className="relative flex flex-col justify-center items-center h-screen bg-background text-foreground p-8 overflow-hidden">
      <Image
        src="/Logo_SF.png"
        alt="Logo do aplicativo"
        width={512}
        height={512}
        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 object-contain opacity-40"
        priority
      />
      <div className="relative flex flex-col items-center mt-28">
        <Icon icon="eos-icons:loading" className="h-12 w-12 text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
