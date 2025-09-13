"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoginScreen } from "./login-screen";
import { getFirestore, doc, getDoc } from "firebase/firestore";

interface AuthGuardProps {
  children: React.ReactNode;
}

const LoadingScreen = ({ text }: { text: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <p className="text-lg text-muted-foreground animate-pulse">{text}</p>
  </div>
);

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading: authLoading, projectId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Um único estado para saber se já temos a resposta final sobre o perfil
  const [isProfileChecked, setIsProfileChecked] = useState(false);

  useEffect(() => {
    // Se a autenticação do Firebase ainda está rolando, a gente espera.
    if (authLoading) {
      return;
    }

    // Se não tem usuário, não há perfil para checar. Fim da verificação.
    if (!user) {
      setIsProfileChecked(true);
      return;
    }

    // Se chegamos aqui, TEMOS um usuário. Vamos checar seu status de onboarding.
    const checkOnboardingStatus = async () => {
      if (!projectId || !user.uid) {
        setIsProfileChecked(true);
        return;
      }

      try {
        const db = getFirestore();
        const settingsRef = doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/profile`,
          "settings"
        );
        const docSnap = await getDoc(settingsRef);

        const hasCompletedOnboarding =
          docSnap.exists() && docSnap.data().onboardingCompleted;

        if (hasCompletedOnboarding) {
          if (pathname === "/welcome") {
            router.push("/");
          }
        } else {
          if (pathname !== "/welcome") {
            router.push("/welcome");
          }
        }
      } catch (error) {
        console.error(
          "AuthGuard: Erro ao buscar perfil. Redirecionando para onboarding por segurança.",
          error
        );
        if (pathname !== "/welcome") {
          router.push("/welcome");
        }
      } finally {
        setIsProfileChecked(true);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading, projectId, pathname, router]);

  // --- Lógica de Renderização ---

  // Enquanto a autenticação OU a checagem do nosso perfil estiverem rolando,
  // mostramos um loader.
  if (authLoading || !isProfileChecked) {
    return <LoadingScreen text="Verificando seus dados..." />;
  }

  // Se, após todas as checagens, existir um usuário,
  // a lógica do useEffect já decidiu se ele deve ser redirecionado ou não.
  // Então, é seguro renderizar o conteúdo.
  if (user) {
    return <>{children}</>;
  }

  // Se, após todas as checagens, não houver usuário, mostramos a tela de login.
  return <LoginScreen />;
}
