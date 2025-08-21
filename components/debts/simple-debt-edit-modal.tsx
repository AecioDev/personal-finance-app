"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SimpleDebtEditForm } from "@/components/forms/simple-debt-edit-form";
import { Debt } from "@/interfaces/finance";

interface SimpleDebtEditModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  debt: Debt | null;
}

export function SimpleDebtEditModal({
  isOpen,
  onOpenChange,
  debt,
}: SimpleDebtEditModalProps) {
  if (!debt) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Ajuste os detalhes da sua despesa. Esta ação não afeta transações já
            realizadas.
          </DialogDescription>
        </DialogHeader>
        <SimpleDebtEditForm
          debt={debt}
          onFinished={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
