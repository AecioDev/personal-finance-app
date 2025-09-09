// in: components/dashboard/dashboard-view.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useFinance } from "@/components/providers/finance-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { FinancialEntry, EntryType } from "@/interfaces/financial-entry"; // NOVO: Importando FinancialEntry
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { getMonth, getYear, addMonths, subMonths } from "date-fns";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { UpcomingDebtsList } from "./upcoming-debts-list"; // Este componente também precisará ser adaptado
import { TransactionList } from "./transaction-list"; // E este também
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { NewFinancialEntryModal } from "../modals/new-financial-entry-modal"; // Usaremos o novo modal

export function DashboardView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    financialEntries,
    accounts,
    categories,
    loadingFinanceData,
    dataSeedCheckCompleted,
    errorFinanceData,
  } = useFinance();

  const isLoadingContent = loadingFinanceData || !dataSeedCheckCompleted;

  const [activeMainTab, setActiveMainTab] = useState("debts");
  const [debtFilter, setDebtFilter] = useState<"pending" | "paid" | "all">(
    "pending"
  );
  const [transactionFilter, setTransactionFilter] = useState<EntryType | "all">(
    "all"
  );
  const [displayDate, setDisplayDate] = useState(new Date());

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  // Refatorado para usar financialEntries
  const { monthlySummary, entriesForMonth } = useMemo(() => {
    const selectedMonth = getMonth(displayDate);
    const selectedYear = getYear(displayDate);

    const currentMonthEntries = financialEntries.filter((entry) => {
      const entryDate = new Date(entry.dueDate); // Usando dueDate para o filtro mensal
      return (
        getMonth(entryDate) === selectedMonth &&
        getYear(entryDate) === selectedYear
      );
    });

    const totalReceitas = currentMonthEntries
      .filter((e) => e.type === "income" && e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);

    const totalDespesas = currentMonthEntries
      .filter((e) => e.type === "expense" && e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);

    const totalPrevisto = currentMonthEntries
      .filter((e) => e.type === "expense")
      .reduce((acc, e) => acc + e.expectedAmount, 0);

    const totalPago = currentMonthEntries
      .filter((e) => e.type === "expense" && e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);

    const faltaPagar = totalPrevisto - totalPago;

    const summary = {
      totalPrevisto,
      totalPago,
      faltaPagar,
      totalDespesas,
      totalReceitas,
    };

    return {
      monthlySummary: summary,
      entriesForMonth: currentMonthEntries.sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      ),
    };
  }, [financialEntries, displayDate]);

  // Refatorado para filtrar as "Contas" (financialEntries de despesa)
  const filteredDebts = useMemo(() => {
    const debts = entriesForMonth.filter((e) => e.type === "expense");
    if (debtFilter === "all") return debts;
    return debts.filter((d) => d.status === debtFilter);
  }, [entriesForMonth, debtFilter]);

  // Refatorado para filtrar os "Lançamentos" (todos os financialEntries)
  const filteredTransactions = useMemo(() => {
    if (transactionFilter === "all") return entriesForMonth;
    return entriesForMonth.filter((e) => e.type === transactionFilter);
  }, [entriesForMonth, transactionFilter]);

  const handlePreviousMonth = () =>
    setDisplayDate((current) => subMonths(current, 1));
  const handleNextMonth = () =>
    setDisplayDate((current) => addMonths(current, 1));

  if (isLoadingContent) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

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
        </div>

        <div className="bg-background rounded-t-[2.5rem] p-4 space-y-4">
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
                      { label: "Abertas", value: "pending" },
                      { label: "Pagas", value: "paid" },
                      { label: "Todas", value: "all" },
                    ]}
                    tabClassName="text-sm"
                    layoutId="debt-filter-tabs"
                  />
                  <div className="mt-4">
                    {/* // TODO: Adaptar o UpcomingDebtsList para receber FinancialEntry[] */}
                    <p className="text-center p-4 text-muted-foreground">
                      Componente de lista de contas a ser adaptado.
                    </p>
                    {/* <UpcomingDebtsList entries={filteredDebts} /> */}
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
                    {/* // TODO: Adaptar o TransactionList para receber FinancialEntry[] */}
                    <p className="text-center p-4 text-muted-foreground">
                      Componente de lista de lançamentos a ser adaptado.
                    </p>
                    {/* <TransactionList entries={filteredTransactions} /> */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Os modais antigos foram removidos, o novo será chamado pela BottomNavBar */}
    </>
  );
}
