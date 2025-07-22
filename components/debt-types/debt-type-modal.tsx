"use client";

import React, { useState } from "react";
import { DebtType } from "@/interfaces/finance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DebtTypeFormContent } from "./debt-type-form-content";
import { useFinance } from "@/components/providers/finance-provider";

interface DebtTypeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  loadingFinanceData: boolean;
}

export function DebtTypeModal({
  isOpen,
  onOpenChange,
  loadingFinanceData,
}: DebtTypeModalProps) {
  const { addDebtType } = useFinance();

  const handleSaveDebtType = async (
    debtTypeData: Omit<DebtType, "id" | "uid" | "createdAt" | "isActive">
  ) => {
    try {
      await addDebtType(debtTypeData);
    } catch (error) {
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Tipo de Dívida</DialogTitle>
          <DialogDescription>
            Adicione um novo tipo para categorizar suas dívidas.
          </DialogDescription>
        </DialogHeader>
        <DebtTypeFormContent
          editingDebtType={null}
          onSave={handleSaveDebtType}
          loadingFinanceData={loadingFinanceData}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
