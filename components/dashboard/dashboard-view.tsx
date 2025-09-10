// src/components/dashboard/dashboard-view.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import {
  DebtInstallment,
  Transaction,
  TransactionType,
} from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { DebtInstallmentModal } from "../debts/debt-installment-modal";
import { getMonth, getYear, addMonths, subMonths, isPast } from "date-fns";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { UpcomingDebtsList } from "./upcoming-debts-list";
import { TransactionList } from "./transaction-list";
import { TransactionDetailsModal } from "./transaction-details-modal";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";

// para migração
import { getFirestore } from "firebase/firestore";
import { exportFullUserData, downloadAsJson } from "@/lib/migration";

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
    dataSeedCheckCompleted,
    errorFinanceData,
    refreshData,
  } = useFinance();

  const isLoadingContent = loadingFinanceData || !dataSeedCheckCompleted;
  const [isExporting, setIsExporting] = useState(false);

  const [activeMainTab, setActiveMainTab] = useState("debts");
  const [debtFilter, setDebtFilter] = useState<"open" | "paid" | "all">("open");
  const [transactionFilter, setTransactionFilter] = useState<
    TransactionType | "all"
  >("all");
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
      const selectedMonth = getMonth(displayDate);
      const selectedYear = getYear(displayDate);

      const currentMonthTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          getMonth(transactionDate) === selectedMonth &&
          getYear(transactionDate) === selectedYear
        );
      });

      const totalDespesas = currentMonthTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

      const totalReceitas = currentMonthTransactions
        .filter((t) => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);

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
        totalDespesas,
        totalReceitas,
      };

      return {
        monthlySummary: summary,
        transactionsForMonth: currentMonthTransactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        filteredDebtsForMonth: filteredInstallments,
      };
    }, [debtInstallments, transactions, displayDate, debtFilter]);

  const filteredTransactions = useMemo(() => {
    if (transactionFilter === "all") {
      return transactionsForMonth;
    }
    return transactionsForMonth.filter((t) => t.type === transactionFilter);
  }, [transactionsForMonth, transactionFilter]);

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

  const handleExport = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: "Iniciando exportação...",
      description: "Isso pode levar alguns segundos.",
    });

    try {
      // Nota: Estamos pegando a instância do DB aqui para não precisar
      // refatorar o FinanceProvider. Para uma feature temporária, é uma boa solução.
      const db = getFirestore();
      const fullBackup = await exportFullUserData(db, user.uid);

      // Passe o objeto completo para o download
      downloadAsJson(fullBackup, `backup-completo-dados.json`);
      toast({
        title: "Exportação Concluída!",
        description: "O download do seu arquivo JSON foi iniciado.",
      });
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Falha na Exportação",
        description: "Ocorreu um erro. Verifique o console para detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingContent) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Carregando seus dados...</p>
          {!dataSeedCheckCompleted && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Finalizando verificação inicial...
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleGoToPayment = () => {
    if (!nextDebtToPay || !nextDebtToPayInstallment) return;
    router.push(
      `/debts/${nextDebtToPay.id}/installments/${nextDebtToPayInstallment.id}`
    );
  };

  const isOverdue = nextDebtToPayInstallment
    ? isPast(new Date(nextDebtToPayInstallment.expectedDueDate))
    : false;

  return (
    <>
      <div className="bg-primary">
        <div className="text-primary-foreground p-6 pt-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                Olá, {user?.displayName?.split(" ")[0] || "Usuário"}!
              </h1>
              <p className="text-sm opacity-80">Bem-vindo de volta</p>
            </div>
            <Link href="/profile">
              <img
                src={user?.photoURL || "/placeholder-user.jpg"}
                alt={user?.displayName || "Usuário"}
                className="w-11 h-11 rounded-full cursor-pointer border-2 border-white/50 hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {nextDebtToPay && nextDebtToPayInstallment ? (
            <div className="mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-80 mb-1">
                    {isOverdue ? "Parcela Vencida!" : "Próxima Parcela"}
                  </p>
                  <p className="text-lg font-bold tracking-tight">
                    {nextDebtToPay.description}
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-extrabold mt-1",
                      isOverdue ? "text-fault" : "text-white"
                    )}
                  >
                    {nextDebtToPayInstallment.expectedAmount.toLocaleString(
                      "pt-BR",
                      { style: "currency", currency: "BRL" }
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="text-base bg-accent text-accent-foreground hover:bg-accent/80 w-36"
                    onClick={handleGoToPayment}
                  >
                    <Icon icon="fa6-solid:dollar-sign" className="h-4 w-4" />
                    Pagar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-primary/50 border-primary-foreground/50 text-base text-primary-foreground hover:bg-primary/70 w-36"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? "Exportando..." : "Exportar 2"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-bold text-lg">Tudo em dia por aqui!</p>
              <p className="text-sm opacity-80">
                Nenhuma conta próxima do vencimento.
              </p>
            </div>
          )}
        </div>

        <div className="bg-background rounded-t-[2.5rem] p-4 space-y-4">
          <div className="grid grid-cols-2 items-center my-4 py-2">
            <div className="border-r border-gray-500">
              <p className="text-sm text-foreground/80 font-medium flex items-center justify-center gap-1.5 mb-1">
                <Icon icon="fa6-solid:arrow-trend-up" className="h-4 w-4" />
                Total de Receitas
              </p>
              {/* AJUSTE DE TAMANHO CONDICIONAL APLICADO AQUI */}
              <p
                className={cn(
                  "text-center font-bold tracking-tight text-accent",
                  monthlySummary.totalReceitas > 10000 ||
                    monthlySummary.totalDespesas > 10000
                    ? "text-2xl"
                    : "text-4xl"
                )}
              >
                {monthlySummary.totalReceitas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
            <div className="border-l border-gray-500 px-2">
              <p className="text-sm text-foreground/80 font-medium flex items-center justify-center gap-1.5 mb-1">
                <Icon icon="fa6-solid:arrow-trend-down" className="h-4 w-4" />
                Total de Despesas
              </p>
              {/* AJUSTE DE TAMANHO CONDICIONAL APLICADO AQUI */}
              <p
                className={cn(
                  "text-center font-bold tracking-tight text-destructive/90",
                  monthlySummary.totalReceitas > 10000 ||
                    monthlySummary.totalDespesas > 10000
                    ? "text-2xl"
                    : "text-4xl"
                )}
              >
                {monthlySummary.totalDespesas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>

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
                <div>
                  <AnimatedTabs
                    defaultValue={transactionFilter}
                    onValueChange={(value) =>
                      setTransactionFilter(value as any)
                    }
                    tabs={[
                      { label: "Receitas", value: "income" },
                      { label: "Despesas", value: "expense" },
                      { label: "Todos", value: "all" },
                    ]}
                    tabClassName="text-sm"
                    layoutId="transaction-filter-tabs"
                  />
                  <div className="mt-4">
                    <TransactionList
                      transactions={filteredTransactions}
                      accounts={accounts}
                      categories={categories}
                      onViewTransaction={handleViewTransaction}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={(isOpen) => {
          setIsInstallmentModalOpen(isOpen);
          if (!isOpen) {
            refreshData();
          }
        }}
        editingInstallment={editingInstallment}
      />
      <TransactionDetailsModal
        isOpen={isTransactionModalOpen}
        onOpenChange={(isOpen) => {
          setIsTransactionModalOpen(isOpen);
          if (!isOpen) {
            refreshData();
          }
        }}
        transaction={selectedTransaction}
      />
    </>
  );
}
