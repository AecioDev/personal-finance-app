"use client";

import React, { useState, useEffect } from "react";
import { PaymentMethod } from "@/interfaces/finance"; // Importa Account
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogFooter, // Apenas DialogFooter é necessário aqui
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useFinance } from "@/components/providers/finance-provider"; // Importa useFinance para accounts

interface PaymentMethodsFormContentProps {
  editingMethod: PaymentMethod | null;
  onSave: (
    method: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "isActive">
  ) => Promise<void>;
  loadingFinanceData: boolean;
  onClose: () => void; // Adicionado para fechar o modal após salvar
}

export function PaymentMethodsFormContent({
  editingMethod,
  onSave,
  loadingFinanceData,
  onClose,
}: PaymentMethodsFormContentProps) {
  const { toast } = useToast();
  const { accounts } = useFinance(); // Pega accounts para o Select

  const [methodName, setMethodName] = useState("");
  const [methodDescription, setMethodDescription] = useState("");
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (editingMethod) {
      setMethodName(editingMethod.name);
      setMethodDescription(editingMethod.description || "");
      setDefaultAccountId(editingMethod.defaultAccountId || null);
    } else {
      setMethodName("");
      setMethodDescription("");
      setDefaultAccountId(null);
    }
  }, [editingMethod]);

  const handleSave = async () => {
    if (!methodName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da forma de pagamento é obrigatório.",
        variant: "destructive",
      });
      return;
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
        name: methodName,
        description: methodDescription,
        defaultAccountId: defaultAccountId || "",
      });
      onClose();
      toast({
        title: "Sucesso",
        description: editingMethod
          ? "Forma de pagamento atualizada."
          : "Forma de pagamento adicionada.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a forma de pagamento.",
        variant: "destructive",
      });
      console.error("Erro ao salvar forma de pagamento no formulário:", error);
      throw error;
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Nome
        </Label>
        <Input
          id="name"
          value={methodName}
          onChange={(e) => setMethodName(e.target.value)}
          className="col-span-3"
          placeholder="Ex: PIX, Cartão Nubank"
          disabled={loadingFinanceData}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Descrição
        </Label>
        <Input
          id="description"
          value={methodDescription}
          onChange={(e) => setMethodDescription(e.target.value)}
          className="col-span-3"
          placeholder="Ex: Chave pessoal, Final 1234"
          disabled={loadingFinanceData}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="defaultAccountId" className="text-right">
          Conta Padrão
        </Label>
        <Select
          value={defaultAccountId || ""}
          onValueChange={(value: string) => setDefaultAccountId(value || null)}
          disabled={loadingFinanceData || accounts.length === 0}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione uma conta (Opcional)" />
          </SelectTrigger>
          <SelectContent>
            {accounts.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">
                Nenhuma conta cadastrada.
              </p>
            ) : (
              accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={loadingFinanceData}>
          Salvar
        </Button>
      </DialogFooter>
    </div>
  );
}
