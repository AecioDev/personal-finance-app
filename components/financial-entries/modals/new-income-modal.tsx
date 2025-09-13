// in: components/modals/new-income-modal.tsx

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FinancialEntryForm } from "../forms/financial-entry-form";

interface NewIncomeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewIncomeModal({ isOpen, onOpenChange }: NewIncomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[480px]"
      >
        <DialogHeader>
          <DialogTitle>Nova Receita</DialogTitle>
          <DialogDescription>
            Registre um novo salário, freela ou qualquer outra entrada de
            dinheiro.
          </DialogDescription>
        </DialogHeader>
        <FinancialEntryForm
          entryType="income"
          onFinished={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
