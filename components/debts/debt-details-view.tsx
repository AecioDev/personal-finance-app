"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Debt,
  DebtInstallment,
  DebtInstallmentStatus,
  Transaction,
} from "@/interfaces/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { DebtInstallmentModal } from "./debt-installment-modal";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { getDDMMYYYY } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface DebtDetailsViewProps {
  debtId: string;
}

const StatCard = ({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: string;
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <div className="flex items-center gap-3 rounded-lg p-3 bg-muted/50">
    <Icon icon={icon} className="w-6 h-6 text-muted-foreground flex-shrink-0" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("font-bold text-lg", valueClassName)}>{value}</p>
    </div>
  </div>
);

export function DebtDetailsView({ debtId }: DebtDetailsViewProps) {
  const router = useRouter();
  const {
    debts,
    debtInstallments,
    transactions,
    deleteDebtInstallment,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"installments" | "transactions">(
    "installments"
  );
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<DebtInstallment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<string | null>(
    null
  );

  const currentDebt = useMemo(
    () => debts.find((d) => d.id === debtId),
    [debts, debtId]
  );

  const filteredInstallments = useMemo(() => {
    if (!currentDebt) return [];
    return debtInstallments
      .filter((inst) => inst.debtId === currentDebt.id)
      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
  }, [debtInstallments, currentDebt]);

  const relatedTransactions = useMemo(() => {
    if (!currentDebt) return [];
    const installmentIds = filteredInstallments.map((inst) => inst.id);
    return transactions
      .filter(
        (t) =>
          t.debtInstallmentId && installmentIds.includes(t.debtInstallmentId)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filteredInstallments, currentDebt]);

  const debtProgress = useMemo(() => {
    if (!currentDebt || !currentDebt.totalRepaymentAmount) return 0;
    const totalPaid = currentDebt.totalPaidOnThisDebt || 0;
    return (totalPaid / currentDebt.totalRepaymentAmount) * 100;
  }, [currentDebt]);

  // CORREÇÃO APLICADA AQUI
  const nextDueDate = useMemo(() => {
    const nextInstallment = filteredInstallments.find(
      (i) => i.status === "pending"
    );
    return nextInstallment
      ? getDDMMYYYY(nextInstallment.expectedDueDate)
      : "N/A";
  }, [filteredInstallments]);

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  useEffect(() => {
    if (!loadingFinanceData && !currentDebt) {
      toast({ title: "Dívida não encontrada", variant: "destructive" });
      router.back();
    }
  }, [loadingFinanceData, currentDebt, router, toast]);

  const getInstallmentBadgeInfo = (status: DebtInstallmentStatus) => {
    switch (status) {
      case "paid":
        return { className: "bg-green-600 text-white", text: "Paga" } as const;
      case "overdue":
        return { variant: "destructive", text: "Atrasada" } as const;
      case "partial":
        return {
          className: "bg-yellow-500 text-white",
          text: "Parcial",
        } as const;
      default:
        return { variant: "secondary", text: "Pendente" } as const;
    }
  };

  const handleEditInstallment = (installment: DebtInstallment) => {
    setEditingInstallment(installment);
    setIsInstallmentModalOpen(true);
  };

  const openDeleteDialog = (installmentId: string) => {
    setInstallmentToDelete(installmentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!installmentToDelete) return;
    const success = await deleteDebtInstallment(installmentToDelete);
    if (success) {
      toast({
        title: "Sucesso",
        description: "Parcela excluída.",
      });
    }
    setInstallmentToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleGoToPayment = (installmentId: string) => {
    router.push(`/debts/${debtId}/installments/${installmentId}`);
  };

  if (loadingFinanceData && !currentDebt) {
    return (
      <div className="p-4 text-center">Carregando detalhes da dívida...</div>
    );
  }

  if (!currentDebt) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <ButtonBack onClick={() => router.back()} />
          <h1 className="text-xl md:text-2xl font-bold text-center mx-4 truncate">
            {currentDebt.description}
          </h1>
          <div className="w-10 h-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo da Dívida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>{debtProgress.toFixed(0)}%</span>
              </div>
              <Progress value={debtProgress} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon="mdi:cash-minus"
                label="Saldo Devedor"
                value={
                  currentDebt.currentOutstandingBalance?.toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  ) ?? "R$ 0,00"
                }
                valueClassName="text-red-600 dark:text-red-400"
              />
              <StatCard
                icon="mdi:cash-check"
                label="Total Pago"
                value={
                  currentDebt.totalPaidOnThisDebt?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) ?? "R$ 0,00"
                }
                valueClassName="text-green-600 dark:text-green-400"
              />
              <StatCard
                icon="mdi:calendar-arrow-right"
                label="Próximo Vencimento"
                value={nextDueDate}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {viewMode === "installments" ? "Parcelas" : "Transações"}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setViewMode((prev) =>
                  prev === "installments" ? "transactions" : "installments"
                )
              }
            >
              <Icon icon="mdi:swap-horizontal" className="mr-2 h-4 w-4" />
              {viewMode === "installments" ? "Ver Transações" : "Ver Parcelas"}
            </Button>
          </CardHeader>
          <CardContent>
            {viewMode === "installments" ? (
              <div className="space-y-2">
                {filteredInstallments.map((installment) => {
                  const badgeInfo = getInstallmentBadgeInfo(installment.status);
                  return (
                    <div
                      key={installment.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            Parcela {installment.installmentNumber}
                          </p>
                          <Badge {...badgeInfo}>{badgeInfo.text}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Venc: {getDDMMYYYY(installment.expectedDueDate)}
                        </p>
                        <p className="text-sm font-medium">
                          {installment.expectedAmount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {installment.status !== "paid" && (
                          <Button
                            size="sm"
                            onClick={() => handleGoToPayment(installment.id)}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditInstallment(installment)}
                        >
                          <Icon icon="mdi:pencil" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {relatedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {getDDMMYYYY(transaction.date)}
                      </p>
                    </div>
                    <p className="font-bold text-red-500">
                      {transaction.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={setIsInstallmentModalOpen}
        editingInstallment={editingInstallment}
        onDataChange={() => {}}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
