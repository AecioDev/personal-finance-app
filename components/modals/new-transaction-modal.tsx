"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimpleTransactionForm } from "../forms/simple-transaction-form";

interface NewTransactionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewTransactionModal({
  isOpen,
  onOpenChange,
}: NewTransactionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <SimpleTransactionForm onFinished={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
