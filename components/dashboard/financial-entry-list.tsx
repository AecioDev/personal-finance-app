// src/components/dashboard/financial-entry-list.tsx
"use client";

import { useState } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { useFinance } from "@/components/providers/finance-provider";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { Category } from "@/interfaces/finance";
import { FinancialEntryDetailsModal } from "../financial-entries/modals/financial-entry-details-modal";
import { FinancialEntryPaymentModal } from "../financial-entries/modals/financial-entry-payment-modal";

interface FinancialEntryListProps {
  entries: FinancialEntry[];
  categories: Category[];
}

export function FinancialEntryList({
  entries,
  categories,
}: FinancialEntryListProps) {
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleViewDetails = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsDetailsModalOpen(true);
  };

  const handleOpenPaymentModal = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsPaymentModalOpen(true);
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
          const dueDate = new Date(entry.dueDate);
          const isIncome = entry.type === "income";
          const isPaid = entry.status === "paid";

          const isOverdue = !isPaid && isPast(dueDate) && !isToday(dueDate);

          const statusColor = isPaid
            ? "bg-status-complete"
            : isOverdue
            ? "bg-destructive"
            : isIncome
            ? "bg-green-500"
            : "bg-status-in-progress";
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
                      { style: "currency", currency: "BRL" }
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPaid && entry.paymentDate
                      ? `Pago em: ${format(
                          new Date(entry.paymentDate),
                          "dd 'de' MMM, yyyy",
                          { locale: ptBR }
                        )}`
                      : isOverdue
                      ? `Venceu em: ${format(dueDate, "dd 'de' MMM, yyyy", {
                          locale: ptBR,
                        })}`
                      : `Vence em: ${format(dueDate, "dd 'de' MMM, yyyy", {
                          locale: ptBR,
                        })}`}
                  </p>
                </div>
              </div>
              <div className="pl-2">
                <Icon
                  icon="fa6-solid:chevron-right"
                  className={cn("h-4 w-4 text-muted-foreground")}
                />
              </div>
            </div>
          );
        })}
      </div>

      <FinancialEntryDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        entry={selectedEntry}
        onPayNow={handleOpenPaymentModal}
      />

      <FinancialEntryPaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        entry={selectedEntry}
      />
    </>
  );
}
