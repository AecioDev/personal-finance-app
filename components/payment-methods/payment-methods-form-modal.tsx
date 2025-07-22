"use client";

import React from "react";
import { PaymentMethod } from "@/interfaces/finance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFinance } from "@/components/providers/finance-provider"; // Para onSave
import { PaymentMethodsFormContent } from "./payment-methods-form-content";

interface PaymentMethodsFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // editingMethod é opcional aqui, pois este modal será principalmente para 'novo'
  loadingFinanceData: boolean;
}

export function PaymentMethodsFormModal({
  isOpen,
  onOpenChange,
  loadingFinanceData,
}: PaymentMethodsFormModalProps) {
  const { addPaymentMethod } = useFinance();

  const handleSavePaymentMethod = async (
    methodData: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "isActive">
  ) => {
    try {
      await addPaymentMethod(methodData);
    } catch (error) {
      // Erro já tratado no PaymentMethodsFormContent via toast, apenas re-lança para garantir
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Forma de Pagamento</DialogTitle>
          <DialogDescription>
            Adicione uma nova forma de pagamento para suas transações.
          </DialogDescription>
        </DialogHeader>
        <PaymentMethodsFormContent
          editingMethod={null} // Sempre null para novo cadastro
          onSave={handleSavePaymentMethod}
          loadingFinanceData={loadingFinanceData}
          onClose={() => onOpenChange(false)} // Passa a função para fechar o modal
        />
      </DialogContent>
    </Dialog>
  );
}
