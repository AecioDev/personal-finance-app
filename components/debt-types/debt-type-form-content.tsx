"use client";

import React, { useState, useEffect } from "react";
import { DebtType } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface DebtTypeFormContentProps {
  editingDebtType: DebtType | null;
  onSave: (
    debtType: Omit<DebtType, "id" | "uid" | "createdAt" | "isActive">
  ) => Promise<void>;
  loadingFinanceData: boolean;
  onClose: () => void;
}

export function DebtTypeFormContent({
  editingDebtType,
  onSave,
  loadingFinanceData,
  onClose,
}: DebtTypeFormContentProps) {
  const { toast } = useToast();

  const [typeName, setTypeName] = useState("");
  const [typeDescription, setTypeDescription] = useState("");

  useEffect(() => {
    if (editingDebtType) {
      setTypeName(editingDebtType.name);
      setTypeDescription(editingDebtType.description || "");
    } else {
      setTypeName("");
      setTypeDescription("");
    }
  }, [editingDebtType]);

  const handleSave = async () => {
    if (!typeName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do tipo de dívida é obrigatório.",
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
        name: typeName,
        description: typeDescription,
      });
      onClose(); // Fecha o modal após salvar
      toast({
        title: "Sucesso",
        description: editingDebtType
          ? "Tipo de dívida atualizado."
          : "Tipo de dívida adicionado.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o tipo de dívida.",
        variant: "destructive",
      });
      console.error("Erro ao salvar tipo de dívida no formulário:", error);
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
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          className="col-span-3"
          placeholder="Ex: Streaming, Contas de Casa"
          disabled={loadingFinanceData}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Descrição
        </Label>
        <Input
          id="description"
          value={typeDescription}
          onChange={(e) => setTypeDescription(e.target.value)}
          className="col-span-3"
          placeholder="Ex: Assinaturas mensais, Aluguel e contas de consumo"
          disabled={loadingFinanceData}
        />
      </div>
      <Button onClick={handleSave} disabled={loadingFinanceData}>
        Salvar
      </Button>
    </div>
  );
}
