"use client";

import React, { useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { Account } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/use-toast";
import { PageViewLayout } from "../layout/page-view-layout";
import { ConfirmationDialog } from "../common/confirmation-dialog";
import { AccountManagerDialog } from "./account-manager-dialog";

export function AccountsView() {
  const { toast } = useToast();
  const { accounts, deleteAccount, loadingFinanceData } = useFinance();

  const [accountSelected, setAccountSelected] = useState<Account | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleEditClick = (account: Account) => {
    setAccountSelected(account);
    setIsManagerOpen(true);
  };

  const handleAddClick = () => {
    setAccountSelected(null);
    setIsManagerOpen(true);
  };

  const handleDeleteClick = (account: Account) => {
    setAccountSelected(account);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountSelected) return;
    try {
      await deleteAccount(accountSelected.id);
      toast({ title: "Sucesso!", description: "Conta excluída." });
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível excluir a conta: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setAccountSelected(null);
    }
  };

  return (
    <PageViewLayout title="Minhas Contas">
      <div>
        <Button
          className="w-full my-2 text-base font-semibold bg-status-complete text-status-complete-foreground"
          size="sm"
          onClick={handleAddClick}
          disabled={loadingFinanceData}
        >
          <Icon icon="mdi:plus" className="h-6 w-6" />
          Nova Conta
        </Button>
      </div>

      {loadingFinanceData && <p>Carregando...</p>}

      {!loadingFinanceData && (
        <div className="space-y-4">
          {accounts.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl bg-background hover:bg-muted/50 transition-colors border-l-4 border-b-2 border-status-complete"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-primary/10">
                  <Icon
                    icon={item.icon || "fa6-solid:piggy-bank"}
                    className="w-8 h-8 text-status-complete"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-bold text-lg text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="font-numeric text-muted-foreground">
                    R${" "}
                    {item.balance?.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    }) ?? "0,00"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleEditClick(item)}
                >
                  <Icon icon="fa6-solid:pencil" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteClick(item)}
                >
                  <Icon icon="fa6-solid:trash-can" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccountManagerDialog
        isOpen={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        accountToEdit={accountSelected}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={`Excluir "${accountSelected?.name}"?`}
        description="Esta ação não pode ser desfeita e removerá permanentemente a conta."
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </PageViewLayout>
  );
}
