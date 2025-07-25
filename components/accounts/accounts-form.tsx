"use client";

import React, { useState, useEffect } from "react";
import { Account } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface AccountsFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount: Account | null;
  onSave: (account: Omit<Account, "id" | "uid" | "createdAt">) => Promise<void>;
  loadingFinanceData: boolean;
}

export function AccountsForm({
  isOpen,
  onOpenChange,
  editingAccount,
  onSave,
  loadingFinanceData,
}: AccountsFormProps) {
  const { toast } = useToast();

  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState("");

  useEffect(() => {
    if (editingAccount) {
      setAccountName(editingAccount.name);
      // Converte para string ou para vazio se for null/undefined
      setAccountBalance(
        editingAccount.balance !== null && editingAccount.balance !== undefined
          ? editingAccount.balance.toString()
          : ""
      );
    } else {
      setAccountName("");
      setAccountBalance("");
    }
  }, [editingAccount]);

  const handleSave = async () => {
    if (!accountName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da conta é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    let parsedBalance: number | null = null;
    if (accountBalance.trim() !== "") {
      parsedBalance = parseFloat(accountBalance);
      if (isNaN(parsedBalance)) {
        toast({
          title: "Erro",
          description: "Saldo deve ser um número válido.",
          variant: "destructive",
        });
        return;
      }
    }

    if (loadingFinanceData) {
      toast({
        title: "Aguarde",
        description:
          "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
        variant: "default",
      });
      return;
    }

    try {
      await onSave({
        name: accountName,
        balance: parsedBalance, // Passa null se o campo estava vazio
        icon: "mdi:bank",
      });
      onOpenChange(false);
      toast({
        title: "Sucesso",
        description: editingAccount
          ? "Conta atualizada."
          : "Conta adicionada com sucesso!",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a conta.",
        variant: "destructive",
      });
      console.error("Erro ao salvar conta no formulário:", error);
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingAccount ? "Editar Conta" : "Adicionar Nova Conta"}
          </DialogTitle>
          <DialogDescription>
            {editingAccount
              ? "Altere os detalhes da sua conta."
              : "Adicione uma nova conta bancária ou carteira."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome da Conta
            </Label>
            <Input
              id="name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Conta Corrente, Poupança"
              disabled={loadingFinanceData}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right">
              Saldo Inicial (Opcional)
            </Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
              disabled={loadingFinanceData}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loadingFinanceData}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
