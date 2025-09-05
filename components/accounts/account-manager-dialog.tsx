"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { Account } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

interface AccountManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  accountToEdit?: Account | null;
}

export function AccountManagerDialog({
  isOpen,
  onOpenChange,
  accountToEdit,
}: AccountManagerDialogProps) {
  const { toast } = useToast();
  const { addAccount, updateAccount } = useFinance();

  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setAccountName(accountToEdit.name);
        setAccountBalance(accountToEdit.balance?.toString() || "");
      } else {
        setAccountName("");
        setAccountBalance("");
      }
    }
  }, [isOpen, accountToEdit]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      toast({
        title: "Atenção!",
        description: "O nome da conta é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Converte o saldo para número, tratando o campo vazio como null
    const balanceValue =
      accountBalance.trim() === ""
        ? null
        : parseFloat(accountBalance.replace(",", "."));

    if (accountBalance.trim() !== "" && isNaN(balanceValue!)) {
      toast({
        title: "Erro de Formato",
        description: "O saldo inicial deve ser um número válido.",
        variant: "destructive",
      });
      return;
    }

    const accountData = {
      name: accountName,
      balance: balanceValue,
      icon: "fa6-solid:piggy-bank", // Ícone padrão
    };

    try {
      if (accountToEdit) {
        await updateAccount(accountToEdit.id, accountData);
        toast({ title: "Sucesso!", description: "Conta atualizada." });
      } else {
        await addAccount(accountData);
        toast({ title: "Sucesso!", description: "Nova conta criada." });
      }
      handleClose();
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível salvar a conta.`,
        variant: "destructive",
      });
    }
  };

  const dialogTitle = accountToEdit ? "Editar Conta" : "Nova Conta";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua conta ou carteira.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <Label
              htmlFor="account-name"
              className="mb-2 block text-sm font-medium"
            >
              Nome da Conta
            </Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ex: Carteira, Conta Corrente"
              className="text-base h-12"
            />
          </div>

          <div>
            <Label
              htmlFor="account-balance"
              className="mb-2 block text-sm font-medium"
            >
              Saldo Inicial (Opcional)
            </Label>
            <Input
              id="account-balance"
              type="text"
              inputMode="decimal"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              placeholder="0,00"
              className="text-base h-12"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              className="bg-status-complete text-status-complete-foreground"
              type="submit"
            >
              <Icon
                icon={accountToEdit ? "fa6-solid:check" : "fa6-solid:plus"}
                className="mr-2 h-5 w-5"
              />
              {accountToEdit ? "Salvar Alterações" : "Criar Conta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
