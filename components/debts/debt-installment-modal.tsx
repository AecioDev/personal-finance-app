"use client";

import React from "react";
import { DebtInstallment } from "@/interfaces/finance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DebtInstallmentFormContent } from "./debt-installment-form-content"; // Importa o conteúdo do formulário
import { useFinance } from "@/components/providers/finance-provider"; // Para onSave

interface DebtInstallmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingInstallment: DebtInstallment | null;
}

export function DebtInstallmentModal({
  isOpen,
  onOpenChange,
  editingInstallment,
}: DebtInstallmentModalProps) {
  const { updateDebtInstallment, loadingFinanceData } = useFinance();

  const handleSaveInstallment = async (
    installmentData: Partial<Omit<DebtInstallment, "id" | "uid" | "createdAt">>
  ) => {
    if (!editingInstallment?.id) {
      throw new Error("ID da parcela ausente para edição.");
    }
    try {
      await updateDebtInstallment(editingInstallment.id, installmentData);
    } catch (error) {
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingInstallment
              ? `Editar Parcela ${editingInstallment.installmentNumber}`
              : "Editar Parcela"}
          </DialogTitle>
          <DialogDescription>Altere os detalhes da parcela.</DialogDescription>
        </DialogHeader>
        <DebtInstallmentFormContent
          editingInstallment={editingInstallment}
          onSave={handleSaveInstallment}
          loadingFinanceData={loadingFinanceData}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
