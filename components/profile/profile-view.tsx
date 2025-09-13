"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { PageViewLayout } from "@/components/layout/page-view-layout";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { ThemeToggle } from "../theme/theme-toggle";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { FullBackup } from "@/hooks/use-financial-entries-crud";
import { downloadAsJson } from "@/lib/utils";

export function ProfileView() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, logout, deleteUserAccount } = useAuth();
  const { exportUserData, importUserData, refreshData } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    toast({ title: "Iniciando exportação..." });
    try {
      const fullBackup = await exportUserData();
      downloadAsJson(fullBackup, `backup-financeiro-${user.uid}.json`);
      toast({
        title: "Exportação Concluída!",
        description: "Seu backup foi salvo com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Falha na Exportação",
        description: `Não foi possível exportar seus dados: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsImportConfirmOpen(true);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleImportConfirm = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    const toastId = toast({
      title: "Importação em Progresso",
      description: "Preparando para ler o arquivo...",
      duration: 180000,
    });

    const updateProgress = (message: string) => {
      toast({
        id: toastId,
        title: "Importação em Progresso",
        description: message,
      });
    };

    try {
      updateProgress("Lendo arquivo JSON...");
      const text = await selectedFile.text();
      const backupData = JSON.parse(text) as FullBackup;

      if (!backupData.financialEntries || !backupData.accounts) {
        throw new Error("O arquivo JSON não parece ser um backup válido.");
      }

      await importUserData(backupData, updateProgress);

      toast({
        id: toastId,
        title: "Importação Concluída!",
        description: "Seus dados foram restaurados. Redirecionando...",
        variant: "success",
        duration: 3000,
      });

      setTimeout(() => {
        refreshData();
        router.push("/");
      }, 3000);
    } catch (error) {
      console.error("Erro na importação:", error);
      toast({
        id: toastId,
        title: "Falha na Importação",
        description: `Verifique o console para detalhes: ${error}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  const handleLogoutConfirmation = async () => {
    await logout();
    router.push("/");
  };

  const handleDeleteAccountConfirm = async () => {
    try {
      toast({
        title: "Removendo sua conta...",
        description: "Isso pode levar alguns instantes. Não feche a página.",
      });
      await deleteUserAccount();
      toast({
        title: "Conta removida com sucesso",
        description: "Sentiremos sua falta. Você será redirecionado.",
        variant: "success",
      });
      router.push("/");
    } catch (error) {
      console.error("Erro ao remover conta:", error);
      toast({
        title: "Erro ao remover a conta",
        description: `Erro: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteAccountOpen(false);
    }
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
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {user?.displayName || "Usuário Anônimo"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portabilidade de Dados (LGPD)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Exporte todos os seus dados para um arquivo JSON ou importe um
              backup previamente salvo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExport}
                disabled={isExporting || isImporting}
              >
                <Icon
                  icon="solar:export-bold-duotone"
                  className="w-5 h-5 mr-3"
                />
                {isExporting ? "Exportando..." : "Exportar Meus Dados"}
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full cursor-pointer"
                disabled={isImporting || isExporting}
              >
                <label
                  htmlFor="import-backup-input"
                  className="flex items-center justify-center w-full h-full cursor-pointer"
                >
                  <Icon
                    icon="solar:import-bold-duotone"
                    className="w-5 h-5 mr-3"
                  />
                  {isImporting ? "Importando..." : "Importar Backup"}
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento da Conta</CardTitle>
            <CardDescription>
              Sair da sua conta ou remover permanentemente todos os seus dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {/* Botão de Sair agora é o vermelho (destrutivo) */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setIsLogoutDialogOpen(true)}
            >
              <Icon
                icon="solar:logout-3-bold-duotone"
                className="w-5 h-5 mr-3"
              />
              Sair da Conta
            </Button>

            {/* Opção de Remover Conta agora é um link sutil */}
            <Button
              variant="link"
              className="text-primary h-auto p-0 text-sm font-normal"
              onClick={() => setIsDeleteAccountOpen(true)}
            >
              Remover minha conta permanentemente
            </Button>
          </CardContent>
        </Card>
      </div>

      <input
        ref={fileInputRef}
        id="import-backup-input"
        type="file"
        onChange={handleFileSelected}
        accept="application/json"
        className="hidden"
      />

      <ConfirmationDialog
        isOpen={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        title="Sair da Conta"
        description="Tem certeza de que deseja sair? Você precisará fazer login novamente para acessar seus dados."
        onConfirm={handleLogoutConfirmation}
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={isImportConfirmOpen}
        onOpenChange={setIsImportConfirmOpen}
        title="Atenção: Importar Backup?"
        description="Esta ação é permanente e irá substituir TODOS os seus dados financeiros atuais pelos dados do arquivo de backup. Deseja continuar?"
        onConfirm={handleImportConfirm}
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={isDeleteAccountOpen}
        onOpenChange={setIsDeleteAccountOpen}
        title="Atenção: Remover sua Conta?"
        description="Esta ação é IRREVERSÍVEL. Todos os seus dados financeiros (contas, categorias, lançamentos) serão permanentemente apagados e sua conta será removida. Deseja continuar?"
        onConfirm={handleDeleteAccountConfirm}
        variant="destructive"
        confirmText="Sim, remover tudo"
      />
    </PageViewLayout>
  );
}
