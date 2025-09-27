// src/components/extrato/statement-comparison-view.tsx
"use client";

import React, { useMemo } from "react";
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

export function StatementComparisonView({
  entries,
  categories,
}: StatementComparisonViewProps) {
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

  return (
    <div className="overflow-x-auto space-y-6">
      {groupedByMonth.map(([month, monthEntries]) => (
        <div key={month}>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {format(new Date(month + "-01"), "MMMM/yyyy", { locale: ptBR })}
          </h4>
          <table className="min-w-[700px] w-full text-sm border mb-6">
            <thead className="bg-muted">
              <tr>
                <th className="text-center p-2">Dia</th>
                <th className="text-left p-2 w-1/3">Descrição</th>
                <th className="text-right p-2">Previsto</th>
                <th className="text-right p-2">Realizado</th>
                <th className="text-right p-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map((e) => {
                const diff = (e.paidAmount ?? 0) - (e.expectedAmount ?? 0);
                const isIncome = e.type === "income";

                return (
                  <tr key={e.id} className="border-t">
                    <td
                      className={cn(
                        "p-2 text-center font-semibold",
                        isIncome ? "text-green-600" : "text-muted-foreground" // Cor mais forte para despesa
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
                        "text-right p-2",
                        isIncome ? "text-green-600" : "text-muted-foreground"
                      )}
                    >
                      {e.expectedAmount?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td
                      className={cn(
                        "text-right p-2",
                        isIncome ? "text-green-600" : "text-muted-foreground"
                      )}
                    >
                      {e.paidAmount?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td
                      className={cn(
                        "text-right p-2 font-medium",
                        diff > 0
                          ? "text-red-600" // Pagou a mais (juros)
                          : diff < 0
                          ? "text-green-600" // Pagou a menos (desconto)
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
      ))}
    </div>
  );
}
