// in: components/dashboard/financial-entry-list.tsx

"use client";

import { useState } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { useFinance } from "@/components/providers/finance-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
// Futuramente, criaremos um modal de detalhes para o FinancialEntry
// import { FinancialEntryDetailsModal } from "./financial-entry-details-modal";

interface FinancialEntryListProps {
  entries: FinancialEntry[];
}

export function FinancialEntryList({ entries }: FinancialEntryListProps) {
  const { categories } = useFinance();
  // Estado para o futuro modal de detalhes
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    // setIsModalOpen(true); // Ativaremos isso quando o modal for criado
  };

  const getCategoryIcon = (categoryId?: string) => {
    if (!categoryId) return "mdi:receipt-text-outline";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || "mdi:help-circle-outline";
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Icon
          icon="mdi:check-circle-outline"
          className="w-16 h-16 mx-auto mb-4 text-primary/50"
        />
        <p className="font-semibold">Tudo certo por aqui!</p>
        <p className="text-sm">
          Nenhum lançamento encontrado para este filtro.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {entries.map((entry) => {
          const isIncome = entry.type === "income";
          const isPaid = entry.status === "paid";
          const isOverdue = entry.status === "overdue";

          // --- Lógica de Estilização Unificada ---
          const statusColor = isPaid
            ? "bg-status-complete"
            : isOverdue
            ? "bg-destructive"
            : isIncome
            ? "bg-green-500" // Cor para receitas pendentes
            : "bg-status-in-progress"; // Cor para despesas pendentes

          const borderColor = isPaid
            ? "border-status-complete"
            : isOverdue
            ? "border-destructive"
            : isIncome
            ? "border-green-500"
            : "border-status-in-progress";

          const textColor = isPaid
            ? "text-status-complete"
            : isOverdue
            ? "text-destructive"
            : isIncome
            ? "text-green-600"
            : "text-foreground";

          const categoryIcon = getCategoryIcon(entry.categoryId);

          return (
            <div
              key={entry.id}
              onClick={() => handleViewDetails(entry)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl bg-background hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-b-2",
                borderColor
              )}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                    statusColor
                  )}
                >
                  <Icon icon={categoryIcon} className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-bold text-base text-foreground truncate">
                    {entry.description}
                  </p>
                  <p
                    className={cn(
                      "font-bold text-base font-numeric",
                      textColor
                    )}
                  >
                    {(entry.paidAmount ?? entry.expectedAmount).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPaid && entry.paymentDate
                      ? `Pago em: ${format(
                          new Date(entry.paymentDate),
                          "dd 'de' MMM, yyyy",
                          { locale: ptBR }
                        )}`
                      : `Vence em: ${format(
                          new Date(entry.dueDate),
                          "dd 'de' MMM, yyyy",
                          {
                            locale: ptBR,
                          }
                        )}`}
                  </p>
                </div>
              </div>

              <div className="pl-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(entry);
                  }}
                >
                  <Icon
                    icon="fa6-solid:chevron-right"
                    className={cn("h-4 w-4 text-muted-foreground")}
                  />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* <FinancialEntryDetailsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        entry={selectedEntry}
      /> 
      */}
    </>
  );
}
