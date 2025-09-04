"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { PageViewLayout } from "@/components/layout/page-view-layout";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { ThemeToggle } from "../theme/theme-toggle"; // Importando o novo componente

export function ProfileView() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <PageViewLayout title="Meu Perfil">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={user?.photoURL || "/placeholder.svg"}
                alt={user?.displayName || "Usuário"}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {user?.displayName || "Usuário Anônimo"}
                </h3>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            {/* E aqui está a mágica! Só chamar o componente! */}
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => setIsLogoutDialogOpen(true)}
            >
              <Icon
                icon="solar:logout-3-bold-duotone"
                className="w-5 h-5 mr-3"
              />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        title="Sair da Conta"
        description="Tem certeza de que deseja sair? Você precisará fazer login novamente para acessar seus dados."
        onConfirm={handleLogout}
        variant="destructive"
      />
    </PageViewLayout>
  );
}
