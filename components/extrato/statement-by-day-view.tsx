// src/components/extrato/statement-by-day-view.tsx
"use client";

import React, { useMemo } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { Category, Account } from "@/interfaces/finance"; // Importa Account
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface StatementByDayViewProps {
  entries: FinancialEntry[];
  categories: Category[];
  accounts: Account[]; // Recebe a lista de contas
}

export function StatementByDayView({
  entries,
  categories,
  accounts,
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

  // ✅ NOVA FUNÇÃO PARA GERAR A DESCRIÇÃO DA TRANSFERÊNCIA
  const getTransferDescription = (entry: FinancialEntry): string => {
    // Encontra o "par" da transferência (a outra perna da operação)
    const siblingEntry = entries.find(
      (e) => e.transferId === entry.transferId && e.id !== entry.id
    );
    if (!siblingEntry) return entry.description; // Fallback

    if (entry.type === "expense") {
      // É a saída
      const destinationAccount = accounts.find(
        (acc) => acc.id === siblingEntry.accountId
      );
      return `Transferência para ${destinationAccount?.name || "outra conta"}`;
    } else {
      // É a entrada
      const sourceAccount = accounts.find(
        (acc) => acc.id === siblingEntry.accountId
      );
      return `Transferência de ${sourceAccount?.name || "outra conta"}`;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Extrato Detalhado</h3>
      <div className="space-y-6">
        {groupedByDay.map(([day, dayEntries]) => {
          const totalDia = dayEntries.reduce((acc, e) => {
            if (e.isTransfer) return acc;
            return (
              acc +
              (e.type === "income" ? e.paidAmount || 0 : -(e.paidAmount || 0))
            );
          }, 0);

          return (
            <div
              key={day}
              className="space-y-2 border-b-2 border-primary/30 pb-4"
            >
              <h4 className="text-sm font-semibold text-muted-foreground">
                {format(new Date(day), "dd 'de' MMMM", { locale: ptBR })}
              </h4>
              <div className="space-y-2">
                {dayEntries.map((e) => {
                  const isTransfer = e.isTransfer ?? false;
                  const itemIcon = isTransfer
                    ? "mdi:swap-horizontal"
                    : getCategoryIcon(e.categoryId);
                  // ✅ USA A NOVA DESCRIÇÃO SE FOR TRANSFERÊNCIA
                  const description = isTransfer
                    ? getTransferDescription(e)
                    : e.description;

                  return (
                    <div
                      key={e.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={itemIcon}
                          className={cn(
                            "w-4 h-4",
                            isTransfer
                              ? "text-blue-500"
                              : "text-muted-foreground"
                          )}
                        />
                        <span>{description}</span>
                      </div>
                      <span
                        className={cn(
                          isTransfer && e.type === "income"
                            ? "text-green-600"
                            : isTransfer && e.type === "expense"
                            ? "text-red-600"
                            : e.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {e.type === "income" ? "+" : "-"}{" "}
                        {(e.paidAmount ?? e.expectedAmount).toLocaleString(
                          "pt-BR",
                          { style: "currency", currency: "BRL" }
                        )}
                      </span>
                    </div>
                  );
                })}
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
