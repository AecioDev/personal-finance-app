// src/components/dashboard/dashboard-view.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { DebtInstallment } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { DebtInstallmentModal } from "../debts/debt-installment-modal";
import { SimpleDebtForm } from "../forms/simple-debt-form";
import { SimpleTransactionForm } from "../forms/simple-transaction-form";
import {
  differenceInDays,
  isPast,
  getMonth,
  getYear,
  addMonths,
  subMonths,
  subDays,
} from "date-fns";

// Importando os novos componentes
import { NextDueDebtCard } from "./next-due-debt-card";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { UpcomingDebtsList } from "./upcoming-debts-list";

export function DashboardView() {
  const { toast } = useToast();
  const { debts, debtInstallments, loadingFinanceData, errorFinanceData } =
    useFinance();

  const [displayDate, setDisplayDate] = useState(new Date());
  const [isNewExpenseDialogOpen, setIsNewExpenseDialogOpen] = useState(false);
  const [isNewTransactionDialogOpen, setIsNewTransactionDialogOpen] =
    useState(false);
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

  const { debtsForMonth, monthlySummary, topOverdueDebts } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = subDays(today, 7);
    const selectedMonth = getMonth(displayDate);
    const selectedYear = getYear(displayDate);

    // Lógica para o Resumo e a Lista do Mês
    const installmentsForMonth = debtInstallments.filter((inst) => {
      const dueDate = new Date(inst.expectedDueDate);
      return (
        getMonth(dueDate) === selectedMonth && getYear(dueDate) === selectedYear
      );
    });
    installmentsForMonth.sort(
      (a, b) =>
        new Date(a.expectedDueDate).getTime() -
        new Date(b.expectedDueDate).getTime()
    );
    const totalPrevisto = installmentsForMonth.reduce(
      (acc, inst) => acc + inst.expectedAmount,
      0
    );
    const totalPago = installmentsForMonth.reduce(
      (acc, inst) => acc + (inst.paidAmount || 0),
      0
    );
    const faltaPagar = totalPrevisto - totalPago;
    const summary = {
      totalPrevisto,
      totalPago,
      faltaPagar: faltaPagar > 0 ? faltaPagar : 0,
    };

    // Lógica para as Dívidas Críticas (para o card interativo)
    const unpaid = debtInstallments.filter((inst) => inst.status !== "paid");
    const overdue = unpaid.filter((inst) =>
      isPast(new Date(inst.expectedDueDate))
    );
    overdue.sort(
      (a, b) =>
        new Date(a.expectedDueDate).getTime() -
        new Date(b.expectedDueDate).getTime()
    );
    const topOverdueInstallments = overdue.slice(0, 5);

    const topOverdueDebtsData = topOverdueInstallments.map((installment) => {
      const debt = debts.find((d) => d.id === installment.debtId);
      const needsUpdate = debt
        ? !debt.lastBalanceUpdate ||
          new Date(debt.lastBalanceUpdate) < sevenDaysAgo
        : false;
      return { debt, installment, needsUpdate };
    });

    return {
      debtsForMonth: installmentsForMonth,
      monthlySummary: summary,
      topOverdueDebts: topOverdueDebtsData,
    };
  }, [debtInstallments, debts, displayDate]);

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

  const nextDebtNeedsUpdate = useMemo(() => {
    if (!nextDebtToPay) return false;
    const sevenDaysAgo = subDays(new Date(), 7);
    return (
      !nextDebtToPay.lastBalanceUpdate ||
      new Date(nextDebtToPay.lastBalanceUpdate) < sevenDaysAgo
    );
  }, [nextDebtToPay]);

  const isNextDebtOverdue = useMemo(() => {
    if (!nextDebtToPayInstallment) return false;
    return (
      isPast(new Date(nextDebtToPayInstallment.expectedDueDate)) &&
      differenceInDays(
        new Date(),
        new Date(nextDebtToPayInstallment.expectedDueDate)
      ) > 0
    );
  }, [nextDebtToPayInstallment]);

  const handlePreviousMonth = () =>
    setDisplayDate((current) => subMonths(current, 1));
  const handleNextMonth = () =>
    setDisplayDate((current) => addMonths(current, 1));
  const handleEditInstallment = (installment: DebtInstallment) => {
    setEditingInstallment(installment);
    setIsInstallmentModalOpen(true);
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
          isOverdue={isNextDebtOverdue}
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
          <UpcomingDebtsList installments={debtsForMonth} debts={debts} />
        </div>
      </div>

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
    </>
  );
}
