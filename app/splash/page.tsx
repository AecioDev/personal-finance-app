// app/splash/page.tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { SplashScreenView } from "@/components/layout/splash-screen-view";
import { Suspense } from "react";

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
