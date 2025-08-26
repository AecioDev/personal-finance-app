"use client";

import React, { useMemo } from "react";
import {
  Account,
  Debt,
  DebtInstallment,
  DebtInstallmentStatus,
  PaymentMethod,
  Transaction,
} from "@/interfaces/finance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getDDMMYYYY } from "@/lib/dates";
import { differenceInDays, isPast } from "date-fns";
import { useFinance } from "../providers/finance-provider";
import { Icon } from "@iconify/react"; // Importando o Icon
import { cn } from "@/lib/utils";

interface DebtInstallmentDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
  installment: DebtInstallment | null;
}

export function DebtInstallmentDetailsModal({
  isOpen,
  onOpenChange,
  debt,
  installment,
}: DebtInstallmentDetailsModalProps) {
  const { transactions, accounts, paymentMethods } = useFinance();

  const paymentInfo = useMemo(() => {
    if (
      !installment ||
      installment.status !== "paid" ||
      !installment.transactionIds?.length
    ) {
      return null;
    }

    const paymentTransaction = transactions.find(
      (t) => t.id === installment.transactionIds[0]
    );
    if (!paymentTransaction) return null;

    const account = accounts.find((a) => a.id === paymentTransaction.accountId);
    const paymentMethod = paymentMethods.find(
      (p) => p.id === paymentTransaction.paymentMethodId
    );

    return {
      accountName: account?.name || "Não encontrada",
      paymentMethodName: paymentMethod?.name || "Não encontrado",
    };
  }, [installment, transactions, accounts, paymentMethods]);

  const overdueInfo = useMemo(() => {
    if (!installment || installment.status === "paid")
      return { isOverdue: false, days: 0 };

    const dueDate = new Date(installment.expectedDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const daysDiff = differenceInDays(today, dueDate);
    const isOverdue = isPast(dueDate) && daysDiff > 0;

    return { isOverdue, days: daysDiff };
  }, [installment]);

  const getInstallmentBadgeInfo = (status: DebtInstallmentStatus) => {
    switch (status) {
      case "paid":
        return "Paga";
      case "overdue":
        return "Atrasada";
      case "partial":
        return "Parcial";
      default:
        return "Pendente";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {debt?.description || "Detalhes da Despesa"}
          </DialogTitle>
          <DialogDescription>
            Resumo dos valores e status desta despesa.
          </DialogDescription>
        </DialogHeader>

        <hr className="border-border" />

        {installment && (
          <div className="space-y-4 text-sm">
            {/* ... (resto das informações do modal continua igual) ... */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">
                {getInstallmentBadgeInfo(installment.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vencimento</span>
              <span className="font-medium">
                {getDDMMYYYY(installment.expectedDueDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor Previsto</span>
              <span className="font-medium">
                {installment.expectedAmount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
            {installment.status === "paid" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Pago</span>
                  <span className="font-medium text-green-600">
                    {(installment.paidAmount || 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                {paymentInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conta</span>
                      <span className="font-medium">
                        {paymentInfo.accountName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Forma de Pag.
                      </span>
                      <span className="font-medium">
                        {paymentInfo.paymentMethodName}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
        {overdueInfo.isOverdue && (
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive">
            <Icon
              icon="mdi:robot-angry-outline"
              className="h-10 w-10 flex-shrink-0"
            />
            <div className="text-xs">
              <p className="font-bold">
                Esta despesa está atrasada há {overdueInfo.days}{" "}
                {overdueInfo.days === 1 ? "dia" : "dias"}.
              </p>
              <p>A cada dia que passa, mais juros você paga!</p>
            </div>
          </div>
        )}

        <DialogFooter className={cn(overdueInfo.isOverdue ? "mt-0" : "mt-4")}>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
