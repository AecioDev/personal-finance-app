// src/components/extrato/extrato-view.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { ExtratoFilters, Filters } from "./extrato-filters";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";
import { StatementSummaryCard } from "./statement-summary-card";
import { StatementByDayView } from "./statement-by-day-view";
import { StatementComparisonView } from "./statement-comparison-view";
import { Button } from "../ui/button";
import { exportToExcel } from "@/lib/utils"; // Importamos nossa nova função
import { Icon } from "@iconify/react"; // Precisaremos do Icon aqui
import { ptBR } from "date-fns/locale";

export function ExtratoView() {
  const { financialEntries, categories, accounts } = useFinance();
  const [view, setView] = useState<"extrato" | "comparativo">("comparativo");

  const [filters, setFilters] = useState<Filters>({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    type: "all",
    status: "all",
    accountId: "all",
    categoryId: "all",
    description: "",
  });

  const filteredEntries = useMemo(() => {
    return financialEntries
      .filter((entry) => {
        const entryDate = new Date(entry.dueDate);
        const from = filters.dateFrom ? startOfDay(filters.dateFrom) : null;
        const to = filters.dateTo ? endOfDay(filters.dateTo) : null;

        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;

        if (filters.type === "transfer") {
          if (!entry.isTransfer) return false;
        } else if (filters.type !== "all") {
          if (entry.isTransfer || entry.type !== filters.type) return false;
        }

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
          !entry.isTransfer &&
          entry.categoryId !== filters.categoryId
        )
          return false;

        if (
          filters.description &&
          !entry.description
            .toLowerCase()
            .includes(filters.description.toLowerCase())
        )
          return false;

        return true;
      })
      .sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      );
  }, [financialEntries, filters]);

  const summaryEntries = useMemo(() => {
    return filteredEntries.filter((entry) => !entry.isTransfer);
  }, [filteredEntries]);

  // ✅ CÁLCULO DOS TOTAIS DE RECEITA E DESPESA
  const { totalIncome, totalExpense } = useMemo(() => {
    const income = summaryEntries
      .filter((e) => e.type === "income" && e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);
    const expense = summaryEntries
      .filter((e) => e.type === "expense" && e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);
    return { totalIncome: income, totalExpense: expense };
  }, [summaryEntries]);

  const comparisonEntries = useMemo(() => {
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
          filters.accountId !== "all" &&
          entry.accountId !== filters.accountId
        )
          return false;
        if (
          filters.categoryId !== "all" &&
          entry.categoryId !== filters.categoryId
        )
          return false;
        if (
          filters.description &&
          !entry.description
            .toLowerCase()
            .includes(filters.description.toLowerCase())
        )
          return false;

        return true;
      });
  }, [financialEntries, filters]);

  // ✅ NOVA FUNÇÃO PARA EXPORTAR OS DADOS
  const handleExport = () => {
    if (comparisonEntries.length === 0) {
      alert("Não há dados para exportar com os filtros atuais.");
      return;
    }

    // 1. Mapeamos os dados para um formato mais limpo para o Excel
    const dataToExport = comparisonEntries.map((entry) => {
      const diff = (entry.paidAmount ?? 0) - (entry.expectedAmount ?? 0);
      return {
        Data: format(new Date(entry.dueDate), "dd/MM/yyyy"),
        Tipo: entry.type === "income" ? "Receita" : "Despesa",
        Categoria:
          categories.find((c) => c.id === entry.categoryId)?.name || "N/A",
        Descrição: entry.description,
        "Valor Previsto": entry.expectedAmount,
        "Valor Realizado": entry.paidAmount,
        Resultado: diff,
      };
    });

    // 2. Definimos o nome do arquivo
    const fileName = `relatorio_previsto_realizado_${format(
      new Date(),
      "yyyy-MM-dd"
    )}`;

    // 3. Chamamos nossa função de exportação
    exportToExcel(dataToExport, fileName, "Previsto x Realizado");
  };

  return (
    <div className="space-y-6">
      <ExtratoFilters onFilterChange={setFilters} />

      <div className="flex justify-between items-center gap-2">
        {/* Botões da esquerda */}
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

        {/* Botão de exportar que só aparece na view 'comparativo' */}
        {view === "comparativo" && (
          <Button variant="outline" onClick={handleExport}>
            <Icon icon="mdi:file-excel-outline" className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        )}
      </div>

      {/* ✅ PASSANDO OS NOVOS TOTAIS PARA O CARD */}
      <StatementSummaryCard
        entries={summaryEntries}
        filters={filters}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      {view === "extrato" && (
        <StatementByDayView
          entries={filteredEntries}
          categories={categories}
          accounts={accounts}
        />
      )}

      {view === "comparativo" && (
        <StatementComparisonView
          entries={comparisonEntries}
          categories={categories}
        />
      )}
    </div>
  );
}
