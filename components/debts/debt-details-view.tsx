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

interface DebtDetailsViewProps {
  debtId: string;
}

export function DebtDetailsView({ debtId }: DebtDetailsViewProps) {
  const router = useRouter();
  const {
    debts,
    debtInstallments,
    transactions,
    accounts,
    paymentMethods,
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

  const debtTotals = useMemo(() => {
    if (!currentDebt)
      return { totalPaid: 0, totalInterest: 0, totalDiscount: 0 };

    const totalPaid = relatedTransactions.reduce(
      (acc, trans) => acc + (trans.amount || 0),
      0
    );
    const totalInterest = relatedTransactions.reduce(
      (acc, trans) => acc + (trans.interestPaid || 0),
      0
    );
    const totalDiscount = relatedTransactions.reduce(
      (acc, trans) => acc + (trans.discountReceived || 0),
      0
    );

    return { totalPaid, totalInterest, totalDiscount };
  }, [currentDebt, relatedTransactions]);

  const summaryCardVariant = useMemo(() => {
    if (debtTotals.totalInterest > debtTotals.totalDiscount)
      return "destructive";
    if (debtTotals.totalDiscount > debtTotals.totalInterest) return "success";
    return "default";
  }, [debtTotals]);

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
        return { variant: "success", text: "Paga" } as const;
      case "overdue":
        return { variant: "destructive", text: "Atrasada" } as const;
      case "partial":
        return { variant: "warning", text: "Parcial" } as const;
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
        variant: "success",
      });
    }
    setInstallmentToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleGoToPayment = (installmentId: string) => {
    router.push(`/debts/${debtId}/installments/${installmentId}`);
  };

  const handleDataChange = () => {
    console.log(
      "Callback recebido! O modal terminou uma operação. A UI deve atualizar em breve."
    );
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
          <CardContent>
            <Card
              className={cn(
                "bg-background border border-border shadow-sm p-4 transition-colors",
                summaryCardVariant === "destructive" &&
                  "bg-red-500/10 border-red-500/30",
                summaryCardVariant === "success" &&
                  "bg-green-500/10 border-green-500/30"
              )}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Coluna da Esquerda: Dados Detalhados */}
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Tipo:</strong> {currentDebt.type}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge
                      variant={currentDebt.isActive ? "secondary" : "success"}
                    >
                      {currentDebt.isActive ? "Ativa" : "Quitada"}
                    </Badge>
                  </p>
                  <p>
                    <strong>Valor Original:</strong> R${" "}
                    {currentDebt.originalAmount?.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {currentDebt.totalRepaymentAmount && (
                    <p>
                      <strong>Valor a Pagar:</strong> R${" "}
                      {currentDebt.totalRepaymentAmount.toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                  )}
                  <p>
                    <strong>Total Pago:</strong> R${" "}
                    {debtTotals.totalPaid.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>

                  {currentDebt.isActive && (
                    <p className="font-semibold text-base">
                      <strong>Saldo Devedor:</strong> R${" "}
                      {currentDebt.currentOutstandingBalance?.toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                  )}

                  {debtTotals.totalInterest > 0 && (
                    <p className="text-red-600 dark:text-red-400">
                      <strong>Juros Pagos:</strong> R${" "}
                      {debtTotals.totalInterest.toFixed(2)}
                    </p>
                  )}
                  {debtTotals.totalDiscount > 0 && (
                    <p className="text-green-600 dark:text-green-400">
                      <strong>Descontos Recebidos:</strong> R${" "}
                      {debtTotals.totalDiscount.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Coluna da Direita: Robozinho Amigo */}
                <div className="text-center">
                  {summaryCardVariant === "destructive" && (
                    <div className="flex flex-col items-center gap-2">
                      <Icon
                        icon="mdi:robot-dead-outline"
                        className="w-10 h-10 text-red-500"
                      />
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        Parece q vc está enfrentando problemas pra pagar essa
                        dívida e os juros estão te deixando mais pobre!
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-bold uppercase tracking-widest text-red-800 dark:text-red-300">
                          Infelizmente vc já pagou:
                        </p>
                        <p className="text-4xl font-black text-red-600 dark:text-red-500">
                          R$ {debtTotals.totalInterest.toFixed(2)}
                        </p>
                        <p className="text-sm font-bold uppercase tracking-widest text-red-800 dark:text-red-300">
                          DE JUROS!!!
                        </p>
                      </div>
                    </div>
                  )}
                  {summaryCardVariant === "success" && (
                    <div className="flex flex-col items-center gap-2">
                      <Icon
                        icon="mdi:robot-happy-outline"
                        className="w-10 h-10 text-green-500"
                      />
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Muito bom! Você está de parabéns. Cada desconto que você
                        consegue é um passo a mais na construção da sua riqueza!
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-bold uppercase tracking-widest text-green-800 dark:text-green-300">
                          ÓTIMO CONTINUE ASSIM!
                        </p>
                        <p className="text-4xl font-black text-green-600 dark:text-green-500">
                          R$ {debtTotals.totalDiscount.toFixed(2)}
                        </p>
                        <p className="text-sm font-bold uppercase tracking-widest text-green-800 dark:text-green-300">
                          DE DESCONTO!!!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
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
              <>
                {filteredInstallments.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Nenhuma parcela encontrada.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {filteredInstallments.map((installment) => {
                      const badgeInfo = getInstallmentBadgeInfo(
                        installment.status
                      );
                      return (
                        <Card
                          key={installment.id}
                          className="bg-background border border-border shadow-sm"
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-semibold">
                                Parcela {installment.installmentNumber || ""}
                              </p>
                              <Badge variant={badgeInfo.variant}>
                                {badgeInfo.text}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Vencimento:{" "}
                              {getDDMMYYYY(installment.expectedDueDate)}
                            </p>
                            <p className="text-sm">
                              Previsto: R${" "}
                              {installment.expectedAmount.toFixed(2)}
                            </p>
                            {installment.status === "partial" && (
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Falta: R${" "}
                                {installment.remainingAmount.toFixed(2)}
                              </p>
                            )}
                            {installment.paidAmount > 0 && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Pago: R$ {installment.paidAmount.toFixed(2)}
                              </p>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                              {installment.status !== "paid" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleGoToPayment(installment.id)
                                  }
                                >
                                  <Icon
                                    icon="mdi:cash-check"
                                    className="w-4 h-4 mr-2"
                                  />
                                  Pagar
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleEditInstallment(installment)
                                }
                              >
                                <Icon icon="mdi:pencil" className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => openDeleteDialog(installment.id)}
                                disabled={installment.status === "paid"}
                              >
                                <Icon icon="mdi:delete" className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {relatedTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Nenhuma transação encontrada para esta dívida.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {relatedTransactions.map((transaction) => {
                      const account = accounts.find(
                        (a) => a.id === transaction.accountId
                      );
                      const paymentMethod = paymentMethods.find(
                        (pm) => pm.id === transaction.paymentMethodId
                      );
                      return (
                        <Card
                          key={transaction.id}
                          className="bg-background border border-border shadow-sm"
                        >
                          <CardContent className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-semibold">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getDDMMYYYY(transaction.date)} via{" "}
                                {paymentMethod?.name} ({account?.name})
                              </p>
                            </div>
                            <p className="font-bold text-base text-red-500">
                              - R$ {transaction.amount.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={setIsInstallmentModalOpen}
        editingInstallment={editingInstallment}
        onDataChange={handleDataChange}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  );
}
