"use client";

import React, { useMemo, useState } from "react";
import {
  Debt,
  DebtInstallment,
  DebtInstallmentStatus,
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
  const hasPayments =
    installment &&
    installment.transactionIds &&
    installment.transactionIds.length > 0;

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
            <div className="space-y-4">
              <div>{debt?.description || "Dívida"}</div>
              {debt?.type === "complete" && (
                <div>Detalhes da Parcela {installment?.installmentNumber}</div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {debt?.type === "complete" ? (
              <span>Resumo dos valores e status desta parcela.</span>
            ) : (
              <span>Resumo dos valores desta despesa.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <hr className="border-1 border-muted-foreground" />

        {installment && (
          <div className="space-y-4  text-sm">
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
            {hasPayments && (
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
                {installment.interestPaidAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Juros Pagos</span>
                    <span className="font-medium text-orange-600">
                      {installment.interestPaidAmount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                )}
                {installment.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Desconto Recebido
                    </span>
                    <span className="font-medium text-green-600">
                      {installment.discountAmount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                )}
                {installment.remainingAmount > 0 &&
                  installment.status === "partial" && (
                    <div className="flex justify-between border-t pt-4 mt-4">
                      <span className="text-muted-foreground">
                        Valor Restante
                      </span>
                      <span className="font-bold text-red-500">
                        {installment.remainingAmount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}
              </>
            )}

            {overdueInfo.isOverdue && (
              <div className="flex justify-between border-t pt-4 mt-4">
                <span className="text-muted-foreground">Vencida há</span>
                <span className="font-bold text-red-500">
                  {overdueInfo.days} dias
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
