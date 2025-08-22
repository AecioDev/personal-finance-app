// src/components/dashboard/dashboard-view.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { DebtInstallment, Transaction } from "@/interfaces/finance";
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
import { NextDueDebtCard } from "./next-due-debt-card";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { UpcomingDebtsList } from "./upcoming-debts-list";
import { TransactionList } from "./transaction-list";
import { TransactionDetailsModal } from "./transaction-details-modal";
import { SimpleTooltip } from "../common/simple-tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function DashboardView() {
  const { toast } = useToast();
  const {
    debts,
    debtInstallments,
    transactions,
    accounts,
    categories,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();

  const [listView, setListView] = useState<"debts" | "transactions">("debts");
  const [displayDate, setDisplayDate] = useState(new Date());
  const [debtFilter, setDebtFilter] = useState<"open" | "paid" | "all">("open");

  const [isNewExpenseDialogOpen, setIsNewExpenseDialogOpen] = useState(false);
  const [isNewTransactionDialogOpen, setIsNewTransactionDialogOpen] =
    useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<DebtInstallment | null>(null);
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

  const {
    monthlySummary,
    topOverdueDebts,
    transactionsForMonth,
    filteredDebtsForMonth,
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

    let filteredInstallments;
    if (debtFilter === "paid") {
      filteredInstallments = allInstallmentsForMonth.filter(
        (inst) => inst.status === "paid"
      );
    } else if (debtFilter === "open") {
      filteredInstallments = allInstallmentsForMonth.filter(
        (inst) => inst.status !== "paid"
      );
    } else {
      filteredInstallments = allInstallmentsForMonth;
    }
    filteredInstallments.sort(
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

    const faltaPagar = allInstallmentsForMonth.reduce((acc, inst) => {
      if (inst.status === "paid") return acc;
      return acc + (inst.remainingAmount ?? inst.expectedAmount);
    }, 0);

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
      monthlySummary: summary,
      topOverdueDebts: topOverdueDebtsData,
      transactionsForMonth: filteredTransactions,
      filteredDebtsForMonth: filteredInstallments,
    };
  }, [debtInstallments, debts, transactions, displayDate, debtFilter]);

  const allUnpaidInstallments = useMemo(() => {
    return debtInstallments
      .filter((inst) => inst.status !== "paid")
      .sort(
        (a, b) =>
          new Date(a.expectedDueDate).getTime() -
          new Date(b.expectedDueDate).getTime()
      );
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {listView === "debts"
                    ? "Contas do Mês"
                    : "Lançamentos do Mês"}
                </CardTitle>
                <SimpleTooltip
                  label={
                    listView === "debts" ? "Ver Lançamentos" : "Ver Contas"
                  }
                >
                  <Icon
                    icon="mdi:swap-horizontal"
                    className="h-8 w-8 text-primary cursor-pointer"
                    onClick={() =>
                      setListView((prev) =>
                        prev === "debts" ? "transactions" : "debts"
                      )
                    }
                  />
                </SimpleTooltip>
              </div>
              {listView === "debts" && (
                <div className="pt-4">
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={debtFilter}
                    onValueChange={(value: "open" | "paid" | "all") => {
                      if (value) setDebtFilter(value);
                    }}
                  >
                    <ToggleGroupItem value="open">Abertas</ToggleGroupItem>
                    <ToggleGroupItem value="paid">Pagas</ToggleGroupItem>
                    <ToggleGroupItem value="all">Todas</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {listView === "debts" ? (
                <UpcomingDebtsList
                  installments={filteredDebtsForMonth}
                  debts={debts}
                />
              ) : (
                <TransactionList
                  transactions={transactionsForMonth}
                  accounts={accounts}
                  categories={categories}
                  onViewTransaction={handleViewTransaction}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
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
