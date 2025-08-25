// src/components/dashboard/dashboard-view.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/modal-provider";
import { useFinance } from "@/components/providers/finance-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { DebtInstallment, Transaction } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Icon } from "@iconify/react";
import { DebtInstallmentModal } from "../debts/debt-installment-modal";
import { SimpleDebtForm } from "../forms/simple-debt-form";
import { SimpleTransactionForm } from "../forms/simple-transaction-form";
import { getMonth, getYear, addMonths, subMonths, isPast } from "date-fns";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { UpcomingDebtsList } from "./upcoming-debts-list";
import { TransactionList } from "./transaction-list";
import { TransactionDetailsModal } from "./transaction-details-modal";
import { cn } from "@/lib/utils"; // Importando o utilitário cn

export function DashboardView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const {
    debts,
    debtInstallments,
    transactions,
    accounts,
    categories,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const {
    isNewExpenseOpen,
    closeNewExpense,
    isNewTransactionOpen,
    closeNewTransaction,
  } = useModal();

  const [activeMainTab, setActiveMainTab] = useState("debts");
  const [debtFilter, setDebtFilter] = useState<"open" | "paid" | "all">("open");
  const [displayDate, setDisplayDate] = useState(new Date());
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

  const { monthlySummary, transactionsForMonth, filteredDebtsForMonth } =
    useMemo(() => {
      // ... (sua lógica de useMemo continua a mesma)
      const selectedMonth = getMonth(displayDate);
      const selectedYear = getYear(displayDate);
      const allInstallmentsForMonth = debtInstallments.filter((inst) => {
        const dueDate = new Date(inst.expectedDueDate);
        return (
          getMonth(dueDate) === selectedMonth &&
          getYear(dueDate) === selectedYear
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
      const filteredTransactions = transactions
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            getMonth(transactionDate) === selectedMonth &&
            getYear(transactionDate) === selectedYear
          );
        })
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      return {
        monthlySummary: summary,
        transactionsForMonth: filteredTransactions,
        filteredDebtsForMonth: filteredInstallments,
      };
    }, [debtInstallments, transactions, displayDate, debtFilter]);

  const nextDebtToPayInstallment = useMemo(() => {
    return (
      debtInstallments
        .filter((inst) => inst.status !== "paid")
        .sort(
          (a, b) =>
            new Date(a.expectedDueDate).getTime() -
            new Date(b.expectedDueDate).getTime()
        )[0] || null
    );
  }, [debtInstallments]);

  const nextDebtToPay = useMemo(() => {
    return nextDebtToPayInstallment
      ? debts.find((d) => d.id === nextDebtToPayInstallment.debtId)
      : null;
  }, [nextDebtToPayInstallment, debts]);

  const handlePreviousMonth = () =>
    setDisplayDate((current) => subMonths(current, 1));
  const handleNextMonth = () =>
    setDisplayDate((current) => addMonths(current, 1));

  const handleCriticalDebtsClick = () => {
    toast({
      title: "Em breve!",
      description: "A página de dívidas críticas será implementada.",
    });
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

  const isOverdue = nextDebtToPayInstallment
    ? isPast(new Date(nextDebtToPayInstallment.expectedDueDate))
    : false;

  return (
    <>
      <div className="bg-background pb-5">
        <div className="text-foreground p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                Olá, {user?.displayName?.split(" ")[0] || "Usuário"}!
              </h1>
              <p className="text-sm text-primary-foreground/80">
                Bem-vindo de volta
              </p>
            </div>
            <Link href="/profile">
              <img
                src={user?.photoURL || "/placeholder-user.jpg"}
                alt={user?.displayName || "Usuário"}
                className="w-11 h-11 rounded-full cursor-pointer border-2 border-primary-foreground/50 hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>
          {nextDebtToPay && nextDebtToPayInstallment ? (
            <div>
              <p className="text-sm text-primary-foreground/80 mb-1">
                {isOverdue ? "Parcela Vencida" : "Próxima Parcela"}
              </p>
              <p className="text-xl font-bold tracking-tight mb-1">
                {nextDebtToPay.description} -{" "}
                {nextDebtToPayInstallment.installmentNumber}/
                {nextDebtToPay.totalInstallments}
              </p>
              {/* =================== AJUSTE AQUI =================== */}
              <p
                className={cn(
                  "text-4xl font-extrabold mb-3",
                  isOverdue ? "text-amber-300" : "text-accent"
                )}
              >
                R$
                {nextDebtToPayInstallment.expectedAmount
                  .toFixed(2)
                  .replace(".", ",")}
              </p>
              {/* =================================================== */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="lg"
                  className="bg-muted-foreground text-muted hover:bg-primary-foreground/90"
                >
                  Pagar
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCriticalDebtsClick}
                >
                  Dívidas Críticas
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-bold text-lg">Tudo em dia por aqui!</p>
              <p className="text-sm text-primary-foreground/80">
                Nenhuma conta próxima do vencimento.
              </p>
            </div>
          )}
        </div>

        <div className="bg-primary rounded-[3.5rem] p-4 space-y-4 pb-8">
          <MonthlySummaryCard
            summary={monthlySummary}
            displayDate={displayDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <div className="mt-2">
            <AnimatedTabs
              defaultValue="debts"
              onValueChange={setActiveMainTab}
              tabs={[
                { label: "Contas", value: "debts" },
                { label: "Lançamentos", value: "transactions" },
              ]}
              tabClassName="text-base"
              layoutId="main-tabs"
            />
            <div className="mt-4">
              {activeMainTab === "debts" && (
                <div>
                  <AnimatedTabs
                    defaultValue={debtFilter}
                    onValueChange={(value) => setDebtFilter(value as any)}
                    tabs={[
                      { label: "Abertas", value: "open" },
                      { label: "Pagas", value: "paid" },
                      { label: "Todas", value: "all" },
                    ]}
                    tabClassName="text-sm"
                    layoutId="debt-filter-tabs"
                  />
                  <div className="mt-4">
                    <UpcomingDebtsList
                      installments={filteredDebtsForMonth}
                      debts={debts}
                      categories={categories}
                    />
                  </div>
                </div>
              )}
              {activeMainTab === "transactions" && (
                <TransactionList
                  transactions={transactionsForMonth}
                  accounts={accounts}
                  categories={categories}
                  onViewTransaction={handleViewTransaction}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAIS */}
      <Dialog open={isNewExpenseOpen} onOpenChange={closeNewExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nova Despesa</DialogTitle>
          </DialogHeader>
          <SimpleDebtForm onFinished={closeNewExpense} />
        </DialogContent>
      </Dialog>
      <Dialog open={isNewTransactionOpen} onOpenChange={closeNewTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <SimpleTransactionForm onFinished={closeNewTransaction} />
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
