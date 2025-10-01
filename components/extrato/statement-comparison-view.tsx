// src/components/extrato/statement-comparison-view.tsx
"use client";

import React, { useMemo, useState } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { Category } from "@/interfaces/finance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface StatementComparisonViewProps {
  entries: FinancialEntry[];
  categories: Category[];
}

// ✅ Definindo as colunas que podem ser ordenadas
type SortableKeys = keyof FinancialEntry | "diff";

export function StatementComparisonView({
  entries,
  categories,
}: StatementComparisonViewProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKeys;
    direction: "ascending" | "descending";
  }>({ key: "dueDate", direction: "descending" });

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, FinancialEntry[]> = {};
    entries.forEach((entry) => {
      const month = format(new Date(entry.dueDate), "yyyy-MM");
      if (!groups[month]) groups[month] = [];
      groups[month].push(entry);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [entries]);

  const getCategoryIcon = (id?: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.icon || "mdi:tag-outline";
  };

  const sortedEntriesByMonth = useMemo(() => {
    const sortedGroups: Record<string, FinancialEntry[]> = {};
    groupedByMonth.forEach(([month, monthEntries]) => {
      const sorted = [...monthEntries].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "diff") {
          aValue = (a.paidAmount ?? 0) - (a.expectedAmount ?? 0);
          bValue = (b.paidAmount ?? 0) - (b.expectedAmount ?? 0);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
      sortedGroups[month] = sorted;
    });
    return sortedGroups;
  }, [groupedByMonth, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === "ascending")
      return <Icon icon="mdi:arrow-up" className="h-4 w-4 ml-1" />;
    return <Icon icon="mdi:arrow-down" className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="overflow-x-auto space-y-6">
      {groupedByMonth.map(([month, monthEntries]) => {
        const monthName = format(
          new Date(`${month}-01T00:00:00`),
          "MMMM/yyyy",
          { locale: ptBR }
        );
        const formattedMonthName =
          monthName.charAt(0).toUpperCase() + monthName.slice(1);

        return (
          <div key={month}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              {formattedMonthName}
            </h4>
            <table className="min-w-[700px] w-full text-sm border mb-6">
              <thead className="bg-muted">
                <tr>
                  <th className="text-center p-2">
                    <button
                      onClick={() => requestSort("dueDate")}
                      className="flex items-center justify-center w-full"
                    >
                      Dia {getSortIcon("dueDate")}
                    </button>
                  </th>
                  <th className="text-left p-2 w-1/3">
                    <button
                      onClick={() => requestSort("description")}
                      className="flex items-center w-full"
                    >
                      Descrição {getSortIcon("description")}
                    </button>
                  </th>
                  <th className="text-right p-2">
                    <button
                      onClick={() => requestSort("expectedAmount")}
                      className="flex items-center justify-end w-full"
                    >
                      Previsto {getSortIcon("expectedAmount")}
                    </button>
                  </th>
                  <th className="text-right p-2">
                    <button
                      onClick={() => requestSort("paidAmount")}
                      className="flex items-center justify-end w-full"
                    >
                      Realizado {getSortIcon("paidAmount")}
                    </button>
                  </th>
                  <th className="text-right p-2">
                    <button
                      onClick={() => requestSort("diff")}
                      className="flex items-center justify-end w-full"
                    >
                      Resultado {getSortIcon("diff")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedEntriesByMonth[month].map((e) => {
                  const diff = (e.paidAmount ?? 0) - (e.expectedAmount ?? 0);
                  const isIncome = e.type === "income";

                  return (
                    <tr key={e.id} className="border-t">
                      <td
                        className={cn(
                          "p-2 text-center font-semibold",
                          isIncome ? "text-green-600" : "text-destructive"
                        )}
                      >
                        {format(new Date(e.dueDate), "dd")}
                      </td>
                      <td className="p-2 flex items-center gap-2">
                        <Icon
                          icon={getCategoryIcon(e.categoryId)}
                          className="w-4 h-4 text-muted-foreground"
                        />
                        {e.description}
                      </td>
                      <td
                        className={cn(
                          "text-right p-2 font-numeric",
                          isIncome ? "text-green-600" : "text-destructive"
                        )}
                      >
                        {e.expectedAmount?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td
                        className={cn(
                          "text-right p-2 font-numeric",
                          isIncome ? "text-green-600" : "text-destructive"
                        )}
                      >
                        {e.paidAmount?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td
                        className={cn(
                          "text-right p-2 font-medium font-numeric",
                          diff > 0
                            ? "text-red-600"
                            : diff < 0
                            ? "text-green-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {(e.paidAmount ?? 0) > 0 && (
                          <>
                            {diff > 0 &&
                              `+ ${diff.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}`}
                            {diff < 0 &&
                              `- ${Math.abs(diff).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}`}
                            {diff === 0 &&
                              `${diff.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}`}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
