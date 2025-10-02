// components/reports/reports-view.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  subMonths,
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/button";
import { Icon } from "@iconify/react";
import { PageViewLayout } from "../layout/page-view-layout";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { CategorySummaryList, CategorySummary } from "./category-summary-list";
import { CategoryPieChart } from "./category-pie-chart";
import { CategoryEntriesSheet } from "./category-entries-sheet";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { CategoryBarChart } from "./category-bar-chart";

type ViewType = "expense" | "income";
type ChartType = "pie" | "bar";

export function ReportsView() {
  const { resolvedTheme } = useTheme();
  const { financialEntries, categories } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("expense");
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [selectedCategory, setSelectedCategory] =
    useState<CategorySummary | null>(null);

  const handlePreviousMonth = () =>
    setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const formattedMonth = useMemo(() => {
    const monthName = format(currentMonth, "MMMM/yyyy", { locale: ptBR });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }, [currentMonth]);

  const monthlyData = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const entriesInMonth = financialEntries.filter((entry) => {
      const entryDate = entry.paymentDate
        ? new Date(entry.paymentDate)
        : new Date(entry.dueDate);
      return (
        entry.status === "paid" &&
        !entry.isTransfer &&
        isWithinInterval(entryDate, { start, end })
      );
    });

    const summary = entriesInMonth.reduce(
      (acc, entry) => {
        const category = categories.find((c) => c.id === entry.categoryId);
        if (!category || !entry.paidAmount) return acc;

        const type = category.type;
        const total = acc[type][category.id]?.total || 0;

        acc[type][category.id] = {
          categoryId: category.id,
          name: category.name,
          icon: category.icon,
          total: total + entry.paidAmount,
          type,
        };
        return acc;
      },
      { income: {}, expense: {} } as Record<
        ViewType,
        Record<string, CategorySummary>
      >
    );

    const expenseSummary = Object.values(summary.expense).sort(
      (a, b) => b.total - a.total
    );
    const incomeSummary = Object.values(summary.income).sort(
      (a, b) => b.total - a.total
    );

    const totalExpenses = expenseSummary.reduce((sum, i) => sum + i.total, 0);
    const totalIncomes = incomeSummary.reduce((sum, i) => sum + i.total, 0);

    return {
      expenseSummary,
      incomeSummary,
      totalExpenses,
      totalIncomes,
      entriesInMonth,
    };
  }, [financialEntries, categories, currentMonth]);

  const selectedCategoryEntries = useMemo(() => {
    if (!selectedCategory) return [];
    return monthlyData.entriesInMonth.filter(
      (entry) => entry.categoryId === selectedCategory.categoryId
    );
  }, [selectedCategory, monthlyData.entriesInMonth]);

  const currentSummary =
    viewType === "expense"
      ? monthlyData.expenseSummary
      : monthlyData.incomeSummary;
  const currentTotal =
    viewType === "expense"
      ? monthlyData.totalExpenses
      : monthlyData.totalIncomes;

  return (
    <PageViewLayout
      title="Relatório"
      subtitle="Resumo de Lançamentos por Categoria"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
            <Icon icon="mdi:chevron-left" className="h-6 w-6" />
          </Button>
          <span className="text-lg font-semibold text-center">
            {formattedMonth}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <Icon icon="mdi:chevron-right" className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={viewType}
            onValueChange={(value: ViewType) => value && setViewType(value)}
            className="w-full"
          >
            <ToggleGroupItem
              value="expense"
              className="w-full data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground"
            >
              Despesas
            </ToggleGroupItem>
            <ToggleGroupItem
              value="income"
              className="w-full data-[state=on]:bg-green-500 data-[state=on]:text-primary-foreground"
            >
              Receitas
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Card
          className={cn(
            "rounded-[2rem] shadow-md bg-muted text-muted-foreground border",
            resolvedTheme === "dark"
              ? "border-primary border-2"
              : "border-primary"
          )}
        >
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de {viewType === "expense" ? "Despesas" : "Receitas"}{" "}
              (Realizado)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p
              className={`text-2xl font-bold ${
                viewType === "expense" ? "text-destructive" : "text-green-500"
              }`}
            >
              {currentTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={chartType}
            onValueChange={(value: ChartType) => value && setChartType(value)}
            className="w-full max-w-xs"
          >
            <ToggleGroupItem
              value="pie"
              className="w-full flex items-center gap-2"
            >
              <Icon icon="mdi:chart-pie" />
              <span>Pizza</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="bar"
              className="w-full flex items-center gap-2"
            >
              <Icon icon="mdi:chart-bar" />
              <span>Barras</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {chartType === "pie" ? (
          <CategoryPieChart
            data={currentSummary}
            title={`Distribuição de ${
              viewType === "expense" ? "Despesas" : "Receitas"
            }`}
          />
        ) : (
          <CategoryBarChart
            data={currentSummary}
            title={`Distribuição de ${
              viewType === "expense" ? "Despesas" : "Receitas"
            }`}
            total={currentTotal}
          />
        )}

        <CategorySummaryList
          title={`Resumo de ${
            viewType === "expense" ? "Despesas" : "Receitas"
          }`}
          summary={currentSummary}
          total={currentTotal}
          type={viewType}
          onCategorySelect={setSelectedCategory}
        />

        <CategoryEntriesSheet
          selectedCategory={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          month={currentMonth}
          entries={selectedCategoryEntries}
        />
      </div>
    </PageViewLayout>
  );
}
