// src/components/extrato/statement-by-day-view.tsx
"use client";

import React, { useMemo } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { Category } from "@/interfaces/finance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface StatementByDayViewProps {
  entries: FinancialEntry[];
  categories: Category[];
}

export function StatementByDayView({
  entries,
  categories,
}: StatementByDayViewProps) {
  const groupedByDay = useMemo(() => {
    const groups: Record<string, FinancialEntry[]> = {};
    entries.forEach((entry) => {
      const day = format(new Date(entry.dueDate), "yyyy-MM-dd");
      if (!groups[day]) groups[day] = [];
      groups[day].push(entry);
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
    <div>
      <h3 className="text-lg font-semibold mb-4">Extrato Detalhado</h3>
      <div className="space-y-6">
        {groupedByDay.map(([day, entries]) => {
          const totalDia = entries.reduce(
            (acc, e) =>
              acc +
              (e.type === "income" ? e.paidAmount || 0 : -(e.paidAmount || 0)),
            0
          );
          return (
            <div
              key={day}
              className="space-y-2 border-b-2 border-primary/30 pb-4"
            >
              <h4 className="text-sm font-semibold text-muted-foreground">
                {format(new Date(day), "dd 'de' MMMM", { locale: ptBR })}
              </h4>
              <div className="space-y-2">
                {entries.map((e) => (
                  <div key={e.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={getCategoryIcon(e.categoryId)}
                        className="w-4 h-4 text-muted-foreground"
                      />
                      <span>{e.description}</span>
                    </div>
                    <span
                      className={cn(
                        "",
                        e.type === "income" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {e.type === "income" ? "+" : "-"}{" "}
                      {(e.paidAmount ?? e.expectedAmount).toLocaleString(
                        "pt-BR",
                        { style: "currency", currency: "BRL" }
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold pt-1">
                <span>Saldo do dia</span>
                <span
                  className={cn(
                    totalDia >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {totalDia.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
