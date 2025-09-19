// app/page.tsx (NOVA VERSÃO)
import { AuthGuard } from "@/components/auth/auth-guard";
import { SplashScreenView } from "@/components/layout/splash-screen-view";
import { Suspense } from "react";

// A página principal agora renderiza a Splash Screen por padrão
function SplashPageContent() {
  return (
    <AuthGuard>
      <SplashScreenView />
    </AuthGuard>
  );
}

export default function SplashPage() {
  return (
    <Suspense>
      <SplashPageContent />
    </Suspense>
  );
}
