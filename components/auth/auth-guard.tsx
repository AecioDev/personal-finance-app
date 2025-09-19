// components/auth/auth-guard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoginScreen } from "./login-screen";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { AppLoader } from "../layout/app-loader";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading: authLoading, projectId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isProfileChecked, setIsProfileChecked] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsProfileChecked(true);
      return;
    }

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

        if (!hasCompletedOnboarding && pathname !== "/welcome") {
          router.replace("/welcome");
        }
      } catch (error) {
        console.error("AuthGuard: Erro ao buscar perfil.", error);
      } finally {
        setIsProfileChecked(true);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading, projectId, pathname, router]);

  if (authLoading || !isProfileChecked) {
    return <AppLoader text="Verificando seus dados..." />;
  }

  if (user) {
    return <>{children}</>;
  }

  return <LoginScreen />;
}
