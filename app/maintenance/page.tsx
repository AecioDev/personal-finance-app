// app/maintenance/page.tsx

export default function MaintenancePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      {/* Você pode colocar seu logo aqui se quiser */}
      <img src="/icon-512x512.png" alt="Logo" className="h-16 mb-8" />

      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
          Estamos em Manutenção
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Nosso aplicativo está recebendo algumas melhorias importantes e
          voltará ao ar em breve. Agradecemos a sua paciência!
        </p>
      </div>
    </main>
  );
}
