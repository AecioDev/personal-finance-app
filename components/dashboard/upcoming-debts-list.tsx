// components/dashboard/upcoming-debts-list.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { cn } from "@/lib/utils";
import { differenceInDays, isPast, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface UpcomingDebtsListProps {
  installments: DebtInstallment[];
  debts: Debt[];
}

export function UpcomingDebtsList({
  installments,
  debts,
}: UpcomingDebtsListProps) {
  const router = useRouter();

  const handleGoToPayment = (debtId: string, installmentId: string) => {
    router.push(`/debts/${debtId}/installments/${installmentId}`);
  };

  if (installments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Próximas Contas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 max-h-[25rem] overflow-y-auto">
        {installments.map((installment) => {
          const debt = debts.find((d) => d.id === installment.debtId);

          const today = new Date();
          const dueDate = new Date(installment.expectedDueDate);
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);

          const daysDiff = differenceInDays(today, dueDate);
          const isOverdue = isPast(dueDate) && daysDiff > 0;

          let statusClass = "bg-green-500/10 border-green-500/20";
          let textClass = "text-green-800 dark:text-green-300";
          let amountClass = "text-green-700";

          if (isOverdue) {
            if (daysDiff > 15) {
              statusClass = "bg-red-500/10 border-red-500/20";
              textClass = "text-red-800 dark:text-red-300";
              amountClass = "text-red-600";
            } else {
              statusClass = "bg-amber-500/10 border-amber-500/20";
              textClass = "text-amber-800 dark:text-amber-300";
              amountClass = "text-amber-700";
            }
          }

          return debt ? (
            <div
              key={installment.id}
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
                <p className={cn("font-bold", amountClass)}>
                  R${" "}
                  {installment.expectedAmount?.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <Button
                  size="sm"
                  onClick={() => handleGoToPayment(debt.id, installment.id)}
                >
                  Pagar
                </Button>
              </div>
            </div>
          ) : null;
        })}
      </CardContent>
    </Card>
  );
}
