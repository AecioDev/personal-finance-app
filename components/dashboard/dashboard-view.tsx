// components/dashboard/dashboard-view.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { DebtInstallment } from "@/interfaces/finance";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { SimpleTooltip } from "../common/simple-tooltip";
import { DebtInstallmentModal } from "../debts/debt-installment-modal";

import { differenceInDays, isPast, isFuture, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SimpleTransactionForm } from "../forms/simple-transaction-form";
import { SimpleDebtForm } from "../forms/simple-debt-form";

export function DashboardView() {
  const { toast } = useToast();
  const router = useRouter();
  const { debts, debtInstallments, loadingFinanceData, errorFinanceData } =
    useFinance();

  // --- CONTROLES DOS MODAIS ---
  const [isNewExpenseDialogOpen, setIsNewExpenseDialogOpen] = useState(false);
  const [isNewTransactionDialogOpen, setIsNewTransactionDialogOpen] =
    useState(false);
  // Estados que você já tinha:
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<DebtInstallment | null>(null);

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  // --- Lógica de cálculo de dívidas (sem alterações) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDebts: DebtInstallment[] = [];
  const overdueDebts: DebtInstallment[] = [];

  debtInstallments.forEach((installment) => {
    if (installment.status === "paid") return;
    const dueDate = new Date(installment.expectedDueDate);
    if (isPast(dueDate) && differenceInDays(today, dueDate) > 0) {
      overdueDebts.push(installment);
    } else {
      upcomingDebts.push(installment);
    }
  });

  overdueDebts.sort(
    (a, b) =>
      new Date(a.expectedDueDate).getTime() -
      new Date(b.expectedDueDate).getTime()
  );
  upcomingDebts.sort(
    (a, b) =>
      new Date(a.expectedDueDate).getTime() -
      new Date(b.expectedDueDate).getTime()
  );

  const nextDebtToPayInstallment = upcomingDebts[0] || overdueDebts[0] || null;
  const nextDebtToPay = nextDebtToPayInstallment
    ? debts.find((d) => d.id === nextDebtToPayInstallment.debtId)
    : null;

  // --- Funções Handler (com a nova lógica de modal) ---
  const handleEditInstallment = (installment: DebtInstallment) => {
    setEditingInstallment(installment);
    setIsInstallmentModalOpen(true);
  };

  const handleGoToPayment = (debtId: string, installmentId: string) => {
    router.push(`/debts/${debtId}/installments/${installmentId}`);
  };

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando dados financeiros...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* --- Card Próxima Dívida e Dicas (sem alterações) --- */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Card Próxima Dívida a Vencer */}
          <Card className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Próxima Dívida a Vencer</CardTitle>
            </CardHeader>
            <CardContent>
              {nextDebtToPayInstallment && nextDebtToPay ? (
                <div>
                  <div className="flex flex-col md:flex-row justify-between md:items-end">
                    <p className="text-2xl font-bold">
                      {nextDebtToPay.description}
                    </p>
                    <p className="text-xl">
                      {`Parcela ${
                        nextDebtToPayInstallment.installmentNumber || ""
                      }`}
                    </p>
                  </div>
                  <p className="text-3xl font-bold">
                    R${" "}
                    {nextDebtToPayInstallment.expectedAmount?.toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                  <p className="text-sm opacity-90">
                    Vence em:{" "}
                    {format(
                      new Date(nextDebtToPayInstallment.expectedDueDate),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-white text-green-600 font-semibold hover:bg-gray-100"
                      onClick={() =>
                        handleGoToPayment(
                          nextDebtToPay.id,
                          nextDebtToPayInstallment.id
                        )
                      }
                    >
                      <Icon icon="mdi:cash-check" className="w-4 h-4 mr-2" />
                      Pagar
                    </Button>
                    <SimpleTooltip label="Editar Parcela" side="top">
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-transparent text-white border-white/50 hover:bg-white/20"
                        onClick={() =>
                          handleEditInstallment(nextDebtToPayInstallment)
                        }
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </Button>
                    </SimpleTooltip>
                    <SimpleTooltip label="Ver Dívida" side="top">
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-transparent text-white border-white/50 hover:bg-white/20"
                        onClick={() =>
                          router.push(`/debts/${nextDebtToPay.id}`)
                        }
                      >
                        <Icon icon="mdi:eye" className="w-4 h-4" />
                      </Button>
                    </SimpleTooltip>
                  </div>
                </div>
              ) : (
                <p className="text-lg">Nenhuma dívida próxima a vencer.</p>
              )}
            </CardContent>
          </Card>

          {/* Card Dicas de Economia */}
          {1 != 1 && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">Dicas de Economia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <Icon
                      icon="mdi:lightbulb-on-outline"
                      className="inline-block w-4 h-4 mr-1 text-yellow-500"
                    />
                    Crie um orçamento e siga-o rigorosamente.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Icon
                      icon="mdi:lightbulb-on-outline"
                      className="inline-block w-4 h-4 mr-1 text-yellow-500"
                    />
                    Priorize o pagamento de dívidas com juros mais altos.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Icon
                      icon="mdi:lightbulb-on-outline"
                      className="inline-block w-4 h-4 mr-1 text-yellow-500"
                    />
                    Evite compras por impulso e use a regra das 24 horas.
                  </p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Ver mais dicas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* --- BOTÕES DE AÇÃO RÁPIDA --- */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setIsNewExpenseDialogOpen(true)}
            className="h-16 text-sm bg-red-500 hover:bg-red-600 text-white"
          >
            <Icon icon="mdi:trending-down" className="w-6 h-6 mr-3" />
            Nova Despesa
          </Button>

          {/* Botão de Novo Lançamento */}
          <Button
            onClick={() => setIsNewTransactionDialogOpen(true)}
            className="h-16 text-sm bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Icon icon="mdi:cash-edit" className="w-6 h-6 mr-3" />
            Novo Lançamento
          </Button>
        </div>

        {/* --- Listas de Dívidas Vencidas e a Vencer (sem alterações) --- */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Dívidas Vencidas */}
          {overdueDebts.length > 0 && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg text-red-500">
                  Dívidas Vencidas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 max-h-[25rem] overflow-y-auto">
                {overdueDebts.map((installment) => {
                  const debt = debts.find((d) => d.id === installment.debtId);
                  return debt ? (
                    <div
                      key={installment.id}
                      className="p-3 rounded-md flex justify-between items-center bg-red-500/10 border border-red-500/20"
                    >
                      <div>
                        <p className="font-semibold text-red-800 dark:text-red-300">
                          {debt.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Venceu em:{" "}
                          {format(
                            new Date(installment.expectedDueDate),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-red-600">
                          R${" "}
                          {installment.expectedAmount?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleGoToPayment(debt.id, installment.id)
                          }
                        >
                          Pagar
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })}
              </CardContent>
            </Card>
          )}

          {/* Dívidas para Vencer */}
          {upcomingDebts.length > 0 && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-600">
                  Dívidas para Vencer
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 max-h-[25rem] overflow-y-auto">
                {upcomingDebts.map((installment) => {
                  const debt = debts.find((d) => d.id === installment.debtId);
                  return debt ? (
                    <div
                      key={installment.id}
                      className="p-3 rounded-md flex justify-between items-center bg-yellow-500/10 border border-yellow-500/20"
                    >
                      <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                          {debt.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vence em:{" "}
                          {format(
                            new Date(installment.expectedDueDate),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-yellow-700">
                          R${" "}
                          {installment.expectedAmount?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleGoToPayment(debt.id, installment.id)
                          }
                        >
                          Pagar
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Nova Despesa (usa o SimpleDebtForm) */}
      <Dialog
        open={isNewExpenseDialogOpen}
        onOpenChange={setIsNewExpenseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nova Despesa</DialogTitle>
          </DialogHeader>
          <SimpleDebtForm onFinished={() => setIsNewExpenseDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Lançamento Geral (usa o SimpleTransactionForm) */}
      <Dialog
        open={isNewTransactionDialogOpen}
        onOpenChange={setIsNewTransactionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <SimpleTransactionForm
            onFinished={() => setIsNewTransactionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Parcela (você já tinha) */}
      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={setIsInstallmentModalOpen}
        editingInstallment={editingInstallment}
      />
    </>
  );
}
