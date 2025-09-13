// in: components/modals/new-expense-modal.tsx

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FinancialEntryForm } from "../forms/financial-entry-form";

interface NewExpenseModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewExpenseModal({
  isOpen,
  onOpenChange,
}: NewExpenseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[480px]"
      >
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Registre uma nova conta ou despesa. Para compras parceladas, use a
            opção "Parcelado".
          </DialogDescription>
        </DialogHeader>
        <FinancialEntryForm
          entryType="expense"
          onFinished={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
