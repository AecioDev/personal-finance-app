// in: components/financial-entries/modals/financial-entry-payment-modal.tsx
"use client";

import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { PaymentFormData, paymentSchema } from "@/schemas/payment-schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FinancialEntryPaymentForm } from "../forms/financial-entry-payment-form";

interface FinancialEntryPaymentModalProps {
  entry: FinancialEntry | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function FinancialEntryPaymentModal({
  entry,
  isOpen,
  onOpenChange,
}: FinancialEntryPaymentModalProps) {
  const { toast } = useToast();
  const { processFinancialEntryPayment, refreshData } = useFinance();

  const formMethods = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  React.useEffect(() => {
    if (entry) {
      const remainingAmount = entry.expectedAmount - (entry.paidAmount || 0);
      formMethods.reset({
        amount: remainingAmount > 0 ? remainingAmount : 0,
        paymentDate: new Date(),
        accountId: "",
        paymentMethodId: "",
      });
    }
  }, [entry, formMethods]);

  if (!entry) return null;

  const isExpense = entry.type === "expense";
  const textContent = {
    title: isExpense ? "Registrar Pagamento" : "Registrar Recebimento",
    amountLabel: isExpense ? "Valor Pago" : "Valor Recebido",
    dateLabel: isExpense ? "Data do Pagamento" : "Data do Recebimento",
    accountLabel: isExpense ? "Pagar com a Conta" : "Receber na Conta",
    submitButton: isExpense ? "Confirmar Pagamento" : "Confirmar Recebimento",
    submittingButton: isExpense
      ? "Registrando Pagamento..."
      : "Registrando Recebimento...",
    toastSuccessTitle: isExpense
      ? "Pagamento Registrado! ✅"
      : "Recebimento Registrado! ✅",
    toastSuccessDescription: isExpense
      ? "Sua conta foi paga com sucesso."
      : "Sua receita foi recebida com sucesso.",
    toastErrorDescription: isExpense
      ? "Não foi possível registrar o pagamento."
      : "Não foi possível registrar o recebimento.",
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    if (!entry) return;

    const success = await processFinancialEntryPayment(entry.id, data);

    if (success) {
      refreshData();
      onOpenChange(false);

      const remainingAmount = entry.expectedAmount - (entry.paidAmount || 0);
      const difference = data.amount - remainingAmount;

      if (difference > 0.01) {
        toast({
          variant: "destructive",
          title: "Juros Detectados! 😟",
          description: `Você pagou ${difference.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })} de juros. Fique atento aos prazos para não ser consumido por eles!`,
          duration: 7000,
        });
      } else if (difference < -0.01) {
        const discount = Math.abs(difference);
        toast({
          variant: "default",
          className:
            "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
          title: "Desconto Obtido! 🎉",
          description: `Parabéns! Você economizou ${discount.toLocaleString(
            "pt-BR",
            { style: "currency", currency: "BRL" }
          )} de desconto nesse pagamento. Continue assim!`,
          duration: 7000,
        });
      } else {
        toast({
          title: textContent.toastSuccessTitle,
          description: textContent.toastSuccessDescription,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Ops! Algo deu errado",
        description: textContent.toastErrorDescription,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{textContent.title}</DialogTitle>
          <DialogDescription>{entry.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Previsto</span>
            <span className="font-bold">
              {entry.expectedAmount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vencimento</span>
            <span>
              {format(new Date(entry.dueDate), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
          {entry.paidAmount && entry.paidAmount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor já Pago</span>
              <span className="font-bold text-green-500">
                {entry.paidAmount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          ) : null}
        </div>

        <FormProvider {...formMethods}>
          <FinancialEntryPaymentForm
            onSubmit={handlePaymentSubmit}
            textContent={textContent}
          />
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
