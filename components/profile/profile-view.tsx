"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../theme/theme-toggle";
import { ButtonBack } from "../ui/button-back";

export function ProfileView() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <ButtonBack onClick={() => router.back()} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.photoURL || "/placeholder.svg"}
              alt={user?.displayName || "Usuário"}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold">{user?.displayName}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ThemeToggle />
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
          >
            <Icon icon="mdi:bell" className="w-5 h-5 mr-3" />
            Notificações
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
          >
            <Icon icon="mdi:shield-check" className="w-5 h-5 mr-3" />
            Privacidade e Segurança
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
          >
            <Icon icon="mdi:help-circle" className="w-5 h-5 mr-3" />
            Ajuda e Suporte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
