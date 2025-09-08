// app/maintenance/page.tsx

import Image from "next/image";
import logoIcon from "@/public/icons/icon-512x512.png";

export default function MaintenancePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Image
        src={logoIcon}
        alt="Logo"
        width={64}
        height={64}
        className="mb-8"
        priority
      />

      <div className="space-y-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
          Estamos em Manutenção
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Nosso aplicativo está recebendo algumas melhorias importantes e
          voltará ao ar em breve. Agradecemos a sua paciência!
        </p>
      </div>
    </main>
  );
}
