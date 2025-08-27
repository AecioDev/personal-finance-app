"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Debt,
  DebtInstallment,
  DebtInstallmentStatus,
} from "@/interfaces/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { DebtInstallmentModal } from "./debt-installment-modal";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { getDDMMYYYY } from "@/lib/dates";
import { cn, getCalculatedInstallmentStatus } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { PageViewLayout } from "@/components/layout/page-view-layout";
import { SimpleDebtEditModal } from "./simple-debt-edit-modal";
import { isPast, isToday } from "date-fns";
import { AnimatedTabs } from "../ui/animated-tabs";

interface DebtDetailsViewProps {
  debtId: string;
}

export function DebtDetailsView({ debtId }: DebtDetailsViewProps) {
  const router = useRouter();
  const {
    debts,
    debtInstallments,
    transactions,
    deleteDebt,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();

  const [activeMainTab, setActiveMainTab] = useState("installments");
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<DebtInstallment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSimpleDebtModalOpen, setIsSimpleDebtModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    return Math.min((totalPaid / currentDebt.totalRepaymentAmount) * 100, 100);
  }, [currentDebt]);

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
    if (!loadingFinanceData && !currentDebt && !isDeleting) {
      toast({ title: "Dívida não encontrada", variant: "destructive" });
      router.back();
    }
  }, [loadingFinanceData, currentDebt, router, toast, isDeleting]);

  const getInstallmentBadgeInfo = (status: DebtInstallmentStatus) => {
    switch (status) {
      case "paid":
        return { variant: "complete", text: "Paga" } as const;
      case "overdue":
        return { variant: "destructive", text: "Atrasada" } as const;
      case "partial":
        return { variant: "warning", text: "Parcial" } as const;
      default:
        return { variant: "progress", text: "Pendente" } as const;
    }
  };

  const handleEditInstallment = (installment: DebtInstallment) => {
    setEditingInstallment(installment);
    setIsInstallmentModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentDebt) return;
    setIsDeleting(true);
    const success = await deleteDebt(currentDebt.id);
    if (success) {
      toast({
        title: "Sucesso",
        description: "Dívida e suas parcelas foram excluídas.",
      });
      router.push("/debts");
    } else {
      setIsDeleting(false);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleGoToPayment = (installmentId: string) => {
    router.push(`/debts/${debtId}/installments/${installmentId}`);
  };

  const handleEditDebt = () => {
    if (!currentDebt) return;
    if (currentDebt.type === "simple") {
      setIsSimpleDebtModalOpen(true);
    } else {
      router.push(`/debts/${currentDebt.id}/edit`);
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  if (loadingFinanceData && !currentDebt) {
    return (
      <PageViewLayout title="Resumo da Dívida">
        <div className="p-4 text-center">Carregando detalhes da dívida...</div>
      </PageViewLayout>
    );
  }

  if (isDeleting || !currentDebt) {
    return (
      <PageViewLayout title="Resumo da Dívida">
        <div className="p-4 text-center">Excluindo dívida...</div>
      </PageViewLayout>
    );
  }

  const canEditOrDelete = (currentDebt.totalPaidOnThisDebt || 0) === 0;

  return (
    <PageViewLayout title="Resumo da Dívida">
      {/* Card do Resumo */}
      <Card className="rounded-[2rem] shadow-md bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{currentDebt.description}</CardTitle>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Button variant="outline" size="icon" onClick={handleEditDebt}>
              <Icon icon="mdi:pencil" className="w-4 h-4" />
            </Button>
            {canEditOrDelete && (
              <Button
                variant="destructive"
                size="icon"
                onClick={openDeleteDialog}
              >
                <Icon icon="mdi:delete" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 font-medium">
          <div>
            <Progress
              value={debtProgress}
              className="h-4 bg-warning [&>div]:bg-primary-foreground"
            />
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>{debtProgress.toFixed(0)}% pago</span>
              <span>
                Meta:{" "}
                <span className="text-foreground">
                  {(currentDebt.totalRepaymentAmount ?? 0).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="flex flex-col items-center">
              <span className="text-sm text-muted-foreground">Previsto</span>
              <span className="text-lg font-bold text-foreground">
                {(currentDebt.totalRepaymentAmount ?? 0).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-muted-foreground">Pago</span>
              <span className="text-lg font-bold text-success">
                {(currentDebt.totalPaidOnThisDebt ?? 0).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-muted-foreground">Falta</span>
              <span className="text-lg font-bold text-warning">
                {(currentDebt.currentOutstandingBalance ?? 0).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card das Parcelas */}
      <div className="mt-2">
        <AnimatedTabs
          defaultValue="installments"
          onValueChange={setActiveMainTab}
          tabs={[
            { label: "Contas", value: "installments" },
            { label: "Lançamentos", value: "transactions" },
          ]}
          tabClassName="text-base"
          layoutId="main-tabs"
        />
        <div className="space-y-3 mt-4">
          {activeMainTab === "installments" ? (
            <div className="space-y-4">
              {filteredInstallments.map((installment) => {
                const instStatus = getCalculatedInstallmentStatus(installment);
                const isPaid = instStatus === "paid";
                const isOverdue = instStatus === "overdue";

                const borderColor = isPaid
                  ? "border-green-500"
                  : isOverdue
                  ? "border-destructive"
                  : "border-accent";

                const badgeInfo = getInstallmentBadgeInfo(instStatus);

                return (
                  <div
                    key={installment.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl bg-background hover:bg-muted/50 cursor-pointer transition-colors border-b-2 border-l-4",
                      borderColor
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          Parcela {installment.installmentNumber}
                        </p>
                        <Badge variant={badgeInfo.variant}>
                          {badgeInfo.text}
                        </Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                          {isPaid && installment.paymentDate
                            ? "Pago em: "
                            : isOverdue
                            ? "Venceu em: "
                            : "Vencimento: "}

                          <span className="text-foreground">
                            {isPaid && installment.paymentDate
                              ? getDDMMYYYY(installment.paymentDate)
                              : getDDMMYYYY(installment.expectedDueDate)}
                          </span>
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          Valor:{" "}
                          <span className="text-foreground">
                            {installment.expectedAmount.toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              }
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {!isPaid && (
                        <Button
                          size="sm"
                          onClick={() => handleGoToPayment(installment.id)}
                        >
                          Pagar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInstallment(installment)}
                      >
                        {isPaid && <span>Editar</span>}
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
                  <p className="font-bold text-destructive">
                    {transaction.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={setIsInstallmentModalOpen}
        editingInstallment={editingInstallment}
        onDataChange={() => {}}
      />

      <SimpleDebtEditModal
        isOpen={isSimpleDebtModalOpen}
        onOpenChange={setIsSimpleDebtModalOpen}
        debt={currentDebt}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Excluir Dívida: ${currentDebt?.description}?`}
        description="Esta ação é permanente e excluirá todas as parcelas associadas. Deseja continuar?"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </PageViewLayout>
  );
}
