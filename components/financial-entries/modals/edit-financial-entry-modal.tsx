// in: components/modals/edit-financial-entry-modal.tsx

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FinancialEntryForm } from "../forms/financial-entry-form";
import { FinancialEntry } from "@/interfaces/financial-entry";

interface EditFinancialEntryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  entryToEdit: FinancialEntry | null;
}

export function EditFinancialEntryModal({
  isOpen,
  onOpenChange,
  entryToEdit,
}: EditFinancialEntryModalProps) {
  if (!entryToEdit) {
    return null;
  }

  const title =
    entryToEdit.type === "income" ? "Editar Receita" : "Editar Despesa";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[480px]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Altere os detalhes do seu lançamento abaixo.
          </DialogDescription>
        </DialogHeader>
        <FinancialEntryForm
          entryType={entryToEdit.type}
          onFinished={() => onOpenChange(false)}
          entryToEdit={entryToEdit}
        />
      </DialogContent>
    </Dialog>
  );
}
