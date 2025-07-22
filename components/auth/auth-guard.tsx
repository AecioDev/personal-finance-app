"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoginScreen } from "./login-screen";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se ainda estiver carregando a autenticação, não faz nada e espera
    if (loading) {
      console.log("AuthGuard: Autenticação ainda carregando...");
      return;
    }

    // Se não estiver carregando E não houver usuário,
    // a LoginScreen será renderizada por este componente.
    // Não precisamos de router.push aqui.
    if (!user) {
      console.log("AuthGuard: Usuário não autenticado. Exibindo LoginScreen.");
    } else {
      console.log("AuthGuard: Usuário autenticado:", user.email);
      // Se o usuário estiver logado e a rota atual for /login, redireciona para o dashboard
      // Isso é para evitar que o usuário logado veja a tela de login se tentar acessá-la diretamente
      if (pathname === "/login") {
        // Verifique se router.pathname existe e é a forma correta de pegar a rota atual
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  // Se estiver carregando, mostra uma mensagem de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary p-4">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Verificando autenticação...
        </p>
      </div>
    );
  }

  // Se não estiver carregando E houver um usuário, renderiza o conteúdo protegido
  if (user) {
    return <>{children}</>;
  }

  // Se não estiver carregando E não houver usuário, renderiza a LoginScreen
  return <LoginScreen />;
}
