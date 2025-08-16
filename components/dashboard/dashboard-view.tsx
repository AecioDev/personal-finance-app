// src/components/dashboard/dashboard-view.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { DebtInstallment, Transaction } from "@/interfaces/finance"; // Importando Transaction
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { DebtInstallmentModal } from "../debts/debt-installment-modal";
import { SimpleDebtForm } from "../forms/simple-debt-form";
import { SimpleTransactionForm } from "../forms/simple-transaction-form";
import {
  getMonth,
  getYear,
  addMonths,
  subMonths,
  subDays,
  isPast,
} from "date-fns";

// Importando os componentes do dashboard
import { NextDueDebtCard } from "./next-due-debt-card";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { UpcomingDebtsList } from "./upcoming-debts-list";
import { TransactionList } from "./transaction-list";
import { TransactionDetailsModal } from "./transaction-details-modal"; // Importando o novo modal
import { SimpleTooltip } from "../common/simple-tooltip";

export function DashboardView() {
  const { toast } = useToast();
  const {
    debts,
    debtInstallments,
    transactions,
    accounts,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();

  const [listView, setListView] = useState<"debts" | "transactions">("debts");
  const [displayDate, setDisplayDate] = useState(new Date());

  // Modais de Ação
  const [isNewExpenseDialogOpen, setIsNewExpenseDialogOpen] = useState(false);
  const [isNewTransactionDialogOpen, setIsNewTransactionDialogOpen] =
    useState(false);

  // Modais de Detalhes/Edição
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<DebtInstallment | null>(null);

  // *** NOVOS ESTADOS PARA O MODAL DE TRANSAÇÃO ***
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  // Lógica de dados para o dashboard (useMemo)
  const {
    debtsForMonth,
    monthlySummary,
    topOverdueDebts,
    transactionsForMonth,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = subDays(today, 7);
    const selectedMonth = getMonth(displayDate);
    const selectedYear = getYear(displayDate);

    const allInstallmentsForMonth = debtInstallments.filter((inst) => {
      const dueDate = new Date(inst.expectedDueDate);
      return (
        getMonth(dueDate) === selectedMonth && getYear(dueDate) === selectedYear
      );
    });

    const unpaidInstallmentsForMonth = allInstallmentsForMonth
      .filter((inst) => inst.status !== "paid")
      .sort(
        (a, b) =>
          new Date(a.expectedDueDate).getTime() -
          new Date(b.expectedDueDate).getTime()
      );

    const totalPrevisto = allInstallmentsForMonth.reduce(
      (acc, inst) => acc + inst.expectedAmount,
      0
    );
    const totalPago = allInstallmentsForMonth.reduce(
      (acc, inst) => acc + (inst.paidAmount || 0),
      0
    );
    const faltaPagar = totalPrevisto - totalPago;
    const summary = {
      totalPrevisto,
      totalPago,
      faltaPagar: faltaPagar > 0 ? faltaPagar : 0,
    };

    const unpaid = debtInstallments.filter((inst) => inst.status !== "paid");
    const topOverdueInstallments = unpaid
      .filter((inst) => isPast(new Date(inst.expectedDueDate)))
      .sort(
        (a, b) =>
          new Date(a.expectedDueDate).getTime() -
          new Date(b.expectedDueDate).getTime()
      )
      .slice(0, 5);

    const topOverdueDebtsData = topOverdueInstallments.map((installment) => {
      const debt = debts.find((d) => d.id === installment.debtId);
      const needsUpdate = debt
        ? !debt.lastBalanceUpdate ||
          new Date(debt.lastBalanceUpdate) < sevenDaysAgo
        : false;
      return { debt, installment, needsUpdate };
    });

    const filteredTransactions = transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          getMonth(transactionDate) === selectedMonth &&
          getYear(transactionDate) === selectedYear
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      debtsForMonth: unpaidInstallmentsForMonth,
      monthlySummary: summary,
      topOverdueDebts: topOverdueDebtsData,
      transactionsForMonth: filteredTransactions,
    };
  }, [debtInstallments, debts, transactions, displayDate]);

  const allUnpaidInstallments = useMemo(() => {
    const unpaid = debtInstallments.filter((inst) => inst.status !== "paid");
    unpaid.sort(
      (a, b) =>
        new Date(a.expectedDueDate).getTime() -
        new Date(b.expectedDueDate).getTime()
    );
    return unpaid;
  }, [debtInstallments]);

  const nextDebtToPayInstallment = allUnpaidInstallments[0] || null;

  const nextDebtToPay =
    (nextDebtToPayInstallment
      ? debts.find((d) => d.id === nextDebtToPayInstallment.debtId)
      : null) ?? null;

  const handlePreviousMonth = () =>
    setDisplayDate((current) => subMonths(current, 1));
  const handleNextMonth = () =>
    setDisplayDate((current) => addMonths(current, 1));
  const handleEditInstallment = (installment: DebtInstallment) => {
    setEditingInstallment(installment);
    setIsInstallmentModalOpen(true);
  };

  // *** NOVA FUNÇÃO PARA ABRIR O MODAL DE TRANSAÇÃO ***
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <NextDueDebtCard
          nextDebt={nextDebtToPay}
          nextInstallment={nextDebtToPayInstallment}
          isOverdue={
            !!nextDebtToPayInstallment &&
            isPast(new Date(nextDebtToPayInstallment.expectedDueDate))
          }
          onEditInstallment={handleEditInstallment}
          topOverdueDebts={topOverdueDebts}
        />

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setIsNewExpenseDialogOpen(true)}
            className="h-16 text-sm bg-red-500 hover:bg-red-600 text-white"
          >
            <Icon icon="mdi:trending-down" className="w-6 h-6 mr-3" />
            Nova Despesa
          </Button>
          <Button
            onClick={() => setIsNewTransactionDialogOpen(true)}
            className="h-16 text-sm bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Icon icon="mdi:cash-edit" className="w-6 h-6 mr-3" />
            Novo Lançamento
          </Button>
        </div>

        <div className="space-y-4">
          <MonthlySummaryCard
            summary={monthlySummary}
            displayDate={displayDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {listView === "debts"
                  ? "Próximas Contas"
                  : "Últimos Lançamentos"}
              </CardTitle>
              <SimpleTooltip
                label={listView === "debts" ? "Ver Lançamentos" : "Ver Contas"}
              >
                <Icon
                  icon="mdi:swap-horizontal"
                  className="h-8 w-8 text-yellow-300 cursor-pointer"
                  onClick={() =>
                    setListView((prev) =>
                      prev === "debts" ? "transactions" : "debts"
                    )
                  }
                />
              </SimpleTooltip>
            </CardHeader>
            <CardContent>
              {listView === "debts" ? (
                <UpcomingDebtsList installments={debtsForMonth} debts={debts} />
              ) : (
                <TransactionList
                  transactions={transactionsForMonth}
                  accounts={accounts}
                  onViewTransaction={handleViewTransaction}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais de Ação */}
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

      {/* Modais de Detalhes */}
      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={setIsInstallmentModalOpen}
        editingInstallment={editingInstallment}
      />
      <TransactionDetailsModal
        isOpen={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        transaction={selectedTransaction}
      />
    </>
  );
}
