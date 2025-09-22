// src/components/extrato/extrato-view.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { ExtratoFilters, Filters } from "./extrato-filters";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { StatementSummaryCard } from "./statement-summary-card";
import { StatementByDayView } from "./statement-by-day-view";
import { StatementComparisonView } from "./statement-comparison-view";
import { Button } from "../ui/button";

export function ExtratoView() {
  const { financialEntries, categories } = useFinance();
  const [view, setView] = useState<"extrato" | "comparativo">("extrato");

  const [filters, setFilters] = useState<Filters>({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    type: "all",
    status: "all",
    accountId: "all",
    categoryId: "all",
  });

  const filteredEntries = useMemo(() => {
    return financialEntries
      .filter((entry) => !entry.isTransfer)
      .filter((entry) => {
        const entryDate = new Date(entry.dueDate);
        const from = filters.dateFrom ? startOfDay(filters.dateFrom) : null;
        const to = filters.dateTo ? endOfDay(filters.dateTo) : null;

        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;
        if (filters.type !== "all" && entry.type !== filters.type) return false;
        if (
          filters.status !== "all" &&
          (filters.status === "paid"
            ? entry.status !== "paid"
            : entry.status === "paid")
        )
          return false;
        if (
          filters.accountId !== "all" &&
          entry.accountId !== filters.accountId
        )
          return false;
        if (
          filters.categoryId !== "all" &&
          entry.categoryId !== filters.categoryId
        )
          return false;

        return true;
      })
      .sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      );
  }, [financialEntries, filters]);

  return (
    <div className="space-y-6">
      <ExtratoFilters onFilterChange={setFilters} />

      <div className="flex gap-2">
        <Button
          variant={view === "extrato" ? "default" : "outline"}
          onClick={() => setView("extrato")}
        >
          Extrato
        </Button>
        <Button
          variant={view === "comparativo" ? "default" : "outline"}
          onClick={() => setView("comparativo")}
        >
          Previsto x Realizado
        </Button>
      </div>

      <StatementSummaryCard entries={filteredEntries} filters={filters} />

      {view === "extrato" && (
        <StatementByDayView entries={filteredEntries} categories={categories} />
      )}

      {view === "comparativo" && (
        <StatementComparisonView
          entries={filteredEntries}
          categories={categories}
        />
      )}
    </div>
  );
}
