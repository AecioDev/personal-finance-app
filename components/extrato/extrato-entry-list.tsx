// src/components/extrato/extrato-entry-list.tsx
"use client";

import { FinancialEntry } from "@/interfaces/financial-entry";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { Icon } from "@iconify/react";
import { Badge } from "../ui/badge";

// Removi a necessidade de passar 'categories' já que não usamos mais o ícone
interface ExtratoEntryListProps {
  entries: FinancialEntry[];
}

export function ExtratoEntryList({ entries }: ExtratoEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Icon
          icon="mdi:magnify-remove-outline"
          className="w-16 h-16 mx-auto mb-4 text-primary/50"
        />
        <p className="font-semibold">Nenhum lançamento encontrado</p>
        <p className="text-sm">
          Tente ajustar os filtros para ver mais resultados.
        </p>
      </div>
    );
  }

  return (
    // Removido o Fragmento e os Modais que estavam aqui
    <div className="space-y-3">
      {entries.map((entry) => {
        const dueDate = new Date(entry.dueDate);
        const isPaid = entry.status === "paid";
        const isOverdue = !isPaid && isPast(dueDate) && !isToday(dueDate);
        const isIncome = entry.type === "income";

        return (
          // Removido o onClick e o cursor-pointer
          <div key={entry.id} className="p-4 rounded-lg border bg-card">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-card-foreground truncate">
                  {entry.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPaid && entry.paymentDate
                    ? `Pago em: ${format(
                        new Date(entry.paymentDate),
                        "dd/MM/yy"
                      )}`
                    : `Vencimento: ${format(dueDate, "dd/MM/yy")}`}
                </p>
              </div>
              {isPaid ? (
                <Badge variant="success">Realizado</Badge>
              ) : isOverdue ? (
                <Badge variant="destructive">Vencido</Badge>
              ) : (
                <Badge variant="outline">Pendente</Badge>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 text-center border-t pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Valor Previsto</p>
                <p className="font-semibold">
                  {entry.expectedAmount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Realizado</p>
                <p
                  className={cn(
                    "font-semibold",
                    isIncome
                      ? "text-green-500"
                      : isPaid
                      ? "text-green-500"
                      : "text-muted-foreground"
                  )}
                >
                  {(entry.paidAmount ?? 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
