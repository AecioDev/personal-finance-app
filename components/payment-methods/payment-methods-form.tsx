"use client";

import React, { useState, useEffect } from "react";
import { PaymentMethod } from "@/interfaces/finance";
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

interface PaymentMethodsFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingMethod: PaymentMethod | null;
  onSave: (
    method: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "isActive">
  ) => Promise<void>;
  loadingFinanceData: boolean;
}

export function PaymentMethodsForm({
  isOpen,
  onOpenChange,
  editingMethod,
  onSave,
  loadingFinanceData,
}: PaymentMethodsFormProps) {
  const { toast } = useToast();

  const [methodName, setMethodName] = useState("");
  const [methodDescription, setMethodDescription] = useState("");

  useEffect(() => {
    if (editingMethod) {
      setMethodName(editingMethod.name);
      setMethodDescription(editingMethod.description || "");
    } else {
      setMethodName("");
      setMethodDescription("");
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
      });
      onOpenChange(false);
      toast({
        title: "Sucesso",
        description: editingMethod
          ? "Forma de pagamento atualizada."
          : "Forma de pagamento adicionada.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a forma de pagamento.",
        variant: "destructive",
      });
      console.error("Erro ao salvar forma de pagamento no formulário:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingMethod
              ? "Editar Forma de Pagamento"
              : "Nova Forma de Pagamento"}
          </DialogTitle>
          <DialogDescription>
            {editingMethod
              ? "Altere os detalhes da sua forma de pagamento."
              : "Adicione uma nova forma de pagamento para suas transações."}
          </DialogDescription>
        </DialogHeader>
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
