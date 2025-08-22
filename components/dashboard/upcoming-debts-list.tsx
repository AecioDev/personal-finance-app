// components/dashboard/upcoming-debts-list.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { cn } from "@/lib/utils";
import { differenceInDays, isPast, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { DebtInstallmentDetailsModal } from "../debts/debt-installment-details-modal";
import { useState } from "react";

interface UpcomingDebtsListProps {
  installments: DebtInstallment[];
  debts: Debt[];
}

export function UpcomingDebtsList({
  installments,
  debts,
}: UpcomingDebtsListProps) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debtSelected, setDebtSelected] = useState<Debt | null>(null);
  const [selectedInstallment, setSelectedInstallment] =
    useState<DebtInstallment | null>(null);

  const handleViewDetails = (debt: Debt, installment: DebtInstallment) => {
    setDebtSelected(debt);
    setSelectedInstallment(installment);
    setIsModalOpen(true);
  };

  const handleGoToPayment = (debtId: string, installmentId: string) => {
    router.push(`/debts/${debtId}/installments/${installmentId}`);
  };

  if (installments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon
          icon="mdi:check-circle-outline"
          className="w-12 h-12 mx-auto mb-2 text-green-500"
        />
        <p>Nenhuma conta encontrada para este filtro!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-2 max-h-[25rem] overflow-y-auto">
        {installments.map((installment) => {
          const debt = debts.find((d) => d.id === installment.debtId);
          const dueDate = new Date(installment.expectedDueDate);

          const isPaid = installment.status === "paid";
          let statusClass = "";
          let textClass = "";

          if (isPaid) {
            statusClass = "bg-green-500/10 border-green-500/20 opacity-80";
            textClass = "text-green-800 dark:text-green-300";
          } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            const daysDiff = differenceInDays(today, dueDate);
            const isOverdue = isPast(dueDate) && daysDiff > 0;

            if (isOverdue) {
              if (daysDiff > 15) {
                statusClass = "bg-red-500/10 border-red-500/20";
                textClass = "text-red-800 dark:text-red-300";
              } else {
                statusClass = "bg-amber-500/10 border-amber-500/20";
                textClass = "text-amber-800 dark:text-amber-300";
              }
            } else {
              statusClass = "bg-sky-500/10 border-sky-500/20";
              textClass = "text-sky-800 dark:text-sky-300";
            }
          }

          return debt ? (
            <div
              key={installment.id}
              onClick={() => handleViewDetails(debt, installment)}
              className={cn(
                "p-3 rounded-md flex justify-between items-center",
                statusClass
              )}
            >
              <div>
                <p className={cn("font-semibold", textClass)}>
                  {debt.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  Vence em: {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className={cn("font-bold", textClass)}>
                  {installment.expectedAmount?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                {isPaid ? (
                  <div className="flex items-center justify-center w-[76px]">
                    <Icon
                      icon="mdi:check-circle"
                      className="w-6 h-6 text-green-500"
                    />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleGoToPayment(debt.id, installment.id)}
                  >
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          ) : null;
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
