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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "../ui/currency-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconPicker } from "../categories/IconPicker";

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
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [accountType, setAccountType] = useState<Account["type"]>("checking");
  const [accountIcon, setAccountIcon] = useState("fa6-solid:piggy-bank");

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setAccountName(accountToEdit.name);
        setAccountBalance(Math.abs(accountToEdit.balance || 0));
        setAccountType(accountToEdit.type || "checking");
        setAccountIcon(accountToEdit.icon || "fa6-solid:piggy-bank");
      } else {
        setAccountName("");
        setAccountBalance(0);
        setAccountType("checking");
        setAccountIcon("fa6-solid:piggy-bank");
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

    const balanceValue =
      accountType === "credit_card"
        ? -Math.abs(accountBalance)
        : accountBalance;

    const accountData = {
      name: accountName,
      balance: balanceValue,
      type: accountType,
      icon: accountIcon,
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
        description: `Não foi possível salvar a conta: ${error}`,
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
            Preencha os detalhes e escolha um ícone para sua conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <Label className="block text-sm font-medium">Ícone</Label>
              <IconPicker value={accountIcon} onChange={setAccountIcon} />
            </div>
            <div className="flex-1 space-y-6">
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
                  placeholder="Ex: Nubank, Inter, Bradesco"
                  className="text-base h-12"
                />
              </div>

              <div>
                <Label htmlFor="account-type">Tipo de Conta</Label>
                <Select
                  value={accountType}
                  onValueChange={(value) =>
                    setAccountType(value as Account["type"])
                  }
                  disabled={!!accountToEdit}
                >
                  <SelectTrigger id="account-type" className="mt-2 h-12">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="credit_card">
                      Cartão de Crédito
                    </SelectItem>
                    <SelectItem value="other">Outro (Ex: Carteira)</SelectItem>
                  </SelectContent>
                </Select>
                {accountToEdit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    O tipo de conta não pode ser alterado após a criação.
                  </p>
                )}
              </div>
            </div>
          </div>

          {accountType === "credit_card" && (
            <Alert>
              <Icon icon="mdi:lightbulb-on-outline" className="h-4 w-4" />
              <AlertTitle>Como Lançar?</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>
                  1. Lance seus gastos do dia a dia selecionando esta conta do
                  cartão.
                </p>
                <p>
                  2. Ao pagar a fatura, use a função{" "}
                  <strong>"Nova Transferência"</strong> da sua conta corrente
                  para esta.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label
              htmlFor="account-balance"
              className="mb-2 block text-sm font-medium"
            >
              {accountType === "credit_card"
                ? "Valor da Fatura Aberta (Opcional)"
                : "Saldo Inicial (Opcional)"}
            </Label>
            <CurrencyInput
              id="account-balance"
              value={accountBalance}
              onChange={(value) => setAccountBalance(value)}
              placeholder="R$ 0,00"
            />
            {accountType === "credit_card" && !accountToEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Informe o total de gastos já feitos na sua fatura atual.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
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
