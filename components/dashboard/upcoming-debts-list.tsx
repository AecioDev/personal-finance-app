// components/dashboard/upcoming-debts-list.tsx
"use client";

import { Category, Debt, DebtInstallment } from "@/interfaces/finance";
import { cn } from "@/lib/utils";
import { differenceInDays, isPast, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { DebtInstallmentDetailsModal } from "../debts/debt-installment-details-modal";
import { useState } from "react";

interface UpcomingDebtsListProps {
  installments: DebtInstallment[];
  debts: Debt[];
  categories: Category[];
}

export function UpcomingDebtsList({
  installments,
  debts,
  categories,
}: UpcomingDebtsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debtSelected, setDebtSelected] = useState<Debt | null>(null);
  const [selectedInstallment, setSelectedInstallment] =
    useState<DebtInstallment | null>(null);

  const handleViewDetails = (debt: Debt, installment: DebtInstallment) => {
    setDebtSelected(debt);
    setSelectedInstallment(installment);
    setIsModalOpen(true);
  };

  if (installments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Icon
          icon="mdi:check-circle-outline"
          className="w-16 h-16 mx-auto mb-4 text-primary/50"
        />
        <p className="font-semibold">Tudo certo por aqui!</p>
        <p className="text-sm">Nenhuma conta encontrada para este filtro.</p>
      </div>
    );
  }

  const getDebtCategoryIcon = (debt: Debt | undefined) => {
    if (!debt || !debt.categoryId) return "mdi:receipt-text-outline";
    if (!categories) return "mdi:receipt-text-outline";
    const category = categories.find((cat) => cat.id === debt.categoryId);
    return category?.icon || "mdi:receipt-text-outline";
  };

  return (
    <>
      <div className="space-y-3">
        {installments.map((installment) => {
          const debt = debts.find((d) => d.id === installment.debtId);
          if (!debt) return null;

          const dueDate = new Date(installment.expectedDueDate);
          const isPaid = installment.status === "paid";
          const isOverdue =
            !isPaid &&
            isPast(dueDate) &&
            differenceInDays(new Date(), dueDate) > 0;

          const statusColor = isPaid
            ? "bg-green-500"
            : isOverdue
            ? "bg-destructive"
            : "bg-accent";
          const textColor = isPaid
            ? "text-green-500"
            : isOverdue
            ? "text-destructive"
            : "text-foreground";
          const borderColor = isPaid
            ? "border-green-500"
            : isOverdue
            ? "border-destructive"
            : "border-accent";

          const categoryIcon = getDebtCategoryIcon(debt);

          return (
            <div
              key={installment.id}
              onClick={() => handleViewDetails(debt, installment)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl bg-background hover:bg-muted/50 cursor-pointer transition-colors border-l-4",
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
                    {debt.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPaid && installment.paymentDate
                      ? `Pago em: ${format(
                          new Date(installment.paymentDate),
                          "dd 'de' MMM, yyyy",
                          { locale: ptBR }
                        )}`
                      : `Vence em: ${format(dueDate, "dd 'de' MMM, yyyy", {
                          locale: ptBR,
                        })}`}
                  </p>
                </div>
              </div>

              <div className="text-right pl-2">
                <p className={cn("font-bold text-lg", textColor)}>
                  {installment.expectedAmount?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <DebtInstallmentDetailsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        debt={debtSelected}
        installment={selectedInstallment}
      />
    </>
  );
}
