// in: components/dashboard/dashboard-view.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useFinance } from "@/components/providers/finance-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { EntryType } from "@/interfaces/financial-entry";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { getMonth, getYear, addMonths, subMonths } from "date-fns";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { FinancialEntryList } from "./financial-entry-list";

type StatusFilter = "pending" | "paid" | "all";

export function DashboardView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    financialEntries,
    loadingFinanceData,
    dataSeedCheckCompleted,
    errorFinanceData,
  } = useFinance();

  const isLoadingContent = loadingFinanceData || !dataSeedCheckCompleted;

  const [activeMainTab, setActiveMainTab] = useState<EntryType>("expense");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  const { monthlySummary, entriesForMonth } = useMemo(() => {
    const selectedMonth = getMonth(displayDate);
    const selectedYear = getYear(displayDate);

    const currentMonthEntries = financialEntries.filter((entry) => {
      const entryDate = new Date(entry.dueDate);
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
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    };
  }, [financialEntries, displayDate]);

  // 3. Lógica de filtro unificada e simplificada
  const filteredEntries = useMemo(() => {
    // Primeiro, filtra pelo tipo da aba principal (Despesa ou Receita)
    let entries = entriesForMonth.filter((e) => e.type === activeMainTab);

    // Depois, se necessário, filtra pelo status (Abertas ou Pagas)
    if (statusFilter !== "all") {
      entries = entries.filter((e) => e.status === statusFilter);
    }

    return entries;
  }, [entriesForMonth, activeMainTab, statusFilter]);

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
          {/* 4. Abas principais atualizadas */}
          <AnimatedTabs
            defaultValue="expense"
            onValueChange={(value) => setActiveMainTab(value as EntryType)}
            tabs={[
              { label: "Despesas", value: "expense" },
              { label: "Receitas", value: "income" },
            ]}
            tabClassName="text-base"
            layoutId="main-tabs"
          />
          <div className="mt-4">
            {/* 5. Filtro de status único */}
            <AnimatedTabs
              defaultValue={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              tabs={[
                { label: "Abertas", value: "pending" },
                { label: "Pagas", value: "paid" },
                { label: "Todas", value: "all" },
              ]}
              tabClassName="text-sm"
              layoutId="status-filter-tabs"
            />
            <div className="mt-4">
              {/* 6. A lista agora é uma só, recebendo os dados já filtrados */}
              <FinancialEntryList entries={filteredEntries} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
