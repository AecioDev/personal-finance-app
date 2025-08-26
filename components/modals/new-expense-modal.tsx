"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimpleDebtForm } from "../forms/simple-debt-form";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nova Despesa</DialogTitle>
        </DialogHeader>
        <SimpleDebtForm onFinished={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
