"use client";

import React, { useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { Account } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/use-toast";
import { ButtonNew } from "@/components/ui/button-new";
import { ButtonBack } from "@/components/ui/button-back";
import { useRouter } from "next/navigation";
import { AccountsForm } from "./accounts-form";

export function AccountsView() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleOpenForm = (account?: Account) => {
    setEditingAccount(account || null);
    setIsFormOpen(true);
  };

  const handleSaveAccount = async (
    accountData: Omit<Account, "id" | "uid" | "createdAt">
  ) => {
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
      } else {
        await addAccount(accountData);
      }
    } catch (error) {
      console.error("Erro ao salvar conta no view:", error);
      throw error;
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta conta?")) {
      try {
        if (loadingFinanceData) {
          toast({
            title: "Aguarde",
            description:
              "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
            variant: "default",
          });
          return;
        }
        await deleteAccount(accountId);
        toast({
          title: "Sucesso",
          description: "Conta excluída.",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a conta.",
          variant: "destructive",
        });
        console.error("Erro ao excluir conta:", error);
      }
    }
  };

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-500 dark:text-gray-400">Carregando contas...</p>
      </div>
    );
  }

  if (errorFinanceData) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Erro ao carregar dados: {errorFinanceData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Minhas Contas</h1>

        <div className="flex gap-2">
          <ButtonBack onClick={() => router.back()} />
          <ButtonNew
            onClick={() => handleOpenForm()}
            disabled={loadingFinanceData}
          >
            Nova Conta
          </ButtonNew>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Icon
              icon="mdi:bank-outline"
              className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
            />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Adicione sua primeira conta para começar a controlar suas finanças
            </p>
            <ButtonNew
              onClick={() => handleOpenForm()}
              disabled={loadingFinanceData}
            >
              Adicionar Primeira Conta
            </ButtonNew>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon
                      icon={account.icon || "mdi:bank"}
                      className="w-5 h-5 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{account.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      R$
                      {account.balance !== null && account.balance !== undefined
                        ? account.balance.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0,00"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenForm(account)}
                    disabled={loadingFinanceData}
                  >
                    <Icon icon="mdi:pencil" className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteAccount(account.id)}
                    disabled={loadingFinanceData}
                  >
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AccountsForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingAccount={editingAccount}
        onSave={handleSaveAccount}
        loadingFinanceData={loadingFinanceData}
      />
    </div>
  );
}
