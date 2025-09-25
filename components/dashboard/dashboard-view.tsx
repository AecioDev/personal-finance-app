// src/components/dashboard/dashboard-view.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useFinance } from "@/components/providers/finance-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { FinancialEntry, EntryType } from "@/interfaces/financial-entry";
import { Button } from "@/components/ui/button";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import {
  getMonth,
  getYear,
  addMonths,
  subMonths,
  isPast,
  isToday,
} from "date-fns";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { FinancialEntryList } from "./financial-entry-list";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { FinancialEntryPaymentModal } from "../financial-entries/modals/financial-entry-payment-modal";
import { Input } from "../ui/input";

type StatusFilter = "pending" | "paid" | "all";

export function DashboardView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    financialEntries,
    categories,
    loadingFinanceData,
    dataSeedCheckCompleted,
    errorFinanceData,
  } = useFinance();

  const isLoadingContent = loadingFinanceData || !dataSeedCheckCompleted;

  const [activeMainTab, setActiveMainTab] = useState<EntryType>("expense");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [displayDate, setDisplayDate] = useState(new Date());
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(
    null
  );

  const handleOpenPaymentModal = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsPaymentModalOpen(true);
  };

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

    const entriesInDateRange = financialEntries.filter((entry) => {
      const entryDate = new Date(entry.dueDate);
      return (
        getMonth(entryDate) === selectedMonth &&
        getYear(entryDate) === selectedYear
      );
    });

    // ✅ CORREÇÃO: Lista para CÁLCULOS (sem transferências)
    const entriesForSummary = entriesInDateRange.filter(
      (entry) => !entry.isTransfer
    );

    const totalReceitas = entriesForSummary
      .filter((e) => e.type === "income" && e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);

    const totalDespesas = entriesForSummary
      .filter((e) => e.type === "expense" && e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);

    const expensesForMonth = entriesForSummary.filter(
      (e) => e.type === "expense"
    );

    const totalPrevisto = expensesForMonth.reduce(
      (acc, e) => acc + e.expectedAmount,
      0
    );

    const totalPago = expensesForMonth
      .filter((e) => e.status === "paid")
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
      entriesForMonth: entriesInDateRange,
    };
  }, [financialEntries, displayDate]);

  const filteredEntries = useMemo(() => {
    let entries = entriesForMonth;

    if (descriptionFilter) {
      entries = entries.filter((e) =>
        e.description.toLowerCase().includes(descriptionFilter.toLowerCase())
      );
    }

    entries = entries.filter((e) => {
      if (activeMainTab === "income") return e.type === "income";
      if (activeMainTab === "expense") return e.type === "expense";
      return true;
    });

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        entries = entries.filter(
          (e) => e.status === "pending" || e.status === "overdue"
        );
      } else {
        entries = entries.filter((e) => e.status === statusFilter);
      }
    }

    return entries;
  }, [entriesForMonth, activeMainTab, statusFilter, descriptionFilter]);

  const nextEntryToPay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      financialEntries
        .filter(
          (entry) =>
            !entry.isTransfer && // Mantém o filtro aqui para não mostrar transferência como "próxima conta"
            entry.type === "expense" &&
            (entry.status === "pending" || entry.status === "overdue")
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )[0] || null
    );
  }, [financialEntries]);

  const handlePreviousMonth = () =>
    setDisplayDate((current) => subMonths(current, 1));
  const handleNextMonth = () =>
    setDisplayDate((current) => addMonths(current, 1));

  const isOverdue = nextEntryToPay
    ? isPast(new Date(nextEntryToPay.dueDate)) &&
      !isToday(new Date(nextEntryToPay.dueDate))
    : false;

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
        <div className="text-primary-foreground pt-8 pb-4">
          <div className="flex justify-between items-start px-6 mb-4">
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

          {nextEntryToPay ? (
            <div
              className={cn(
                "mt-6 mx-1 p-4 rounded-[2.5rem] transition-colors duration-300 ease-in-out",
                isOverdue
                  ? "bg-destructive-light/40 border-2 border-destructive"
                  : "bg-transparent border border-light"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-80 mb-1">
                    {isOverdue ? "Conta Vencida!" : "Próxima Conta"}
                  </p>
                  <p className="text-lg font-bold tracking-tight">
                    {nextEntryToPay.description}
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-extrabold mt-1",
                      isOverdue ? "text-light" : "text-accent"
                    )}
                  >
                    {nextEntryToPay.expectedAmount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="text-base bg-accent text-accent-foreground hover:bg-accent/80 w-"
                    onClick={() => handleOpenPaymentModal(nextEntryToPay)}
                  >
                    <Icon icon="fa6-solid:dollar-sign" className="h-4 w-4" />
                    Pagar
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
              <p
                className={cn(
                  "text-center font-bold tracking-tight text-accent",
                  monthlySummary.totalReceitas > 10000 ||
                    monthlySummary.totalDespesas > 10000
                    ? "text-3xl"
                    : "text-3xl"
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
              <p
                className={cn(
                  "text-center font-bold tracking-tight text-destructive/90",
                  monthlySummary.totalReceitas > 10000 ||
                    monthlySummary.totalDespesas > 10000
                    ? "text-3xl"
                    : "text-3xl"
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
              <AnimatedTabs
                defaultValue={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusFilter)
                }
                tabs={[
                  { label: "Abertas", value: "pending" },
                  { label: "Pagas", value: "paid" },
                  { label: "Todas", value: "all" },
                ]}
                tabClassName="text-sm"
                layoutId="status-filter-tabs"
              />
              <div className="my-4">
                <Icon
                  icon="mdi:magnify"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar por descrição..."
                  className="pl-10"
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <FinancialEntryList
                  entries={filteredEntries}
                  categories={categories}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FinancialEntryPaymentModal
        entry={selectedEntry}
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
      />
    </>
  );
}
