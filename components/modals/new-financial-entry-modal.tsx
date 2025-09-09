// in: components/modals/new-financial-entry-modal.tsx

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FinancialEntryForm } from "../financial-entries/financial-entry-form";

// 1. Definimos as props que o componente vai receber
interface NewFinancialEntryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewFinancialEntryModal({
  isOpen,
  onOpenChange,
}: NewFinancialEntryModalProps) {
  // 2. Removemos o useState e o DialogTrigger. O controle agora é externo.
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
          <DialogDescription>
            Adicione uma nova receita ou despesa. Para compras parceladas, não
            se esqueça de marcar como recorrente.
          </DialogDescription>
        </DialogHeader>
        <FinancialEntryForm
          onFinished={() => onOpenChange(false)} // Passamos a função para fechar o modal
        />
      </DialogContent>
    </Dialog>
  );
}
