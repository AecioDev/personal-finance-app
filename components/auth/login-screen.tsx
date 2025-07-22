"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { Icon } from "@iconify/react";

export function LoginScreen() {
  const { login } = useAuth();

  const handleGoogleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Icon icon="mdi:wallet" className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Controle Financeiro</CardTitle>
          <CardDescription>
            Gerencie suas finanças pessoais de forma simples e eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleLogin} className="w-full" size="lg">
            <Icon icon="mdi:google" className="w-5 h-5 mr-2" />
            Entrar com Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
