"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Transaction,
  Account,
  PaymentMethod,
  Category,
  DebtInstallment,
} from "@/interfaces/finance";
import { useFinance } from "../providers/finance-provider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: Transaction | null;
}

// Componente auxiliar para renderizar cada linha de detalhe
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-semibold text-right">{value}</span>
  </div>
);

export function TransactionDetailsModal({
  isOpen,
  onOpenChange,
  transaction,
}: TransactionDetailsModalProps) {
  const router = useRouter();
  const { accounts, paymentMethods, categories, debtInstallments } =
    useFinance();

  if (!transaction) return null;

  const account = accounts.find((a) => a.id === transaction.accountId);
  const paymentMethod = paymentMethods.find(
    (pm) => pm.id === transaction.paymentMethodId
  );
  const category = categories.find((c) => c.id === transaction.category); // Supondo que o categoryId está no campo 'category'
  const installment = debtInstallments.find(
    (i) => i.id === transaction.debtInstallmentId
  );

  const handleGoToInstallment = () => {
    if (!installment) return;
    router.push(`/debts/${installment.debtId}/installments/${installment.id}`);
    onOpenChange(false);
  };

  const isIncome = transaction.type === "income";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isIncome
                  ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
              )}
            >
              <Icon
                icon={isIncome ? "mdi:arrow-up-thin" : "mdi:arrow-down-thin"}
                className="w-5 h-5"
              />
            </div>
            Detalhes do Lançamento
          </DialogTitle>
          <DialogDescription>{transaction.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <DetailRow
            label="Valor"
            value={
              <span
                className={cn(isIncome ? "text-green-500" : "text-red-500")}
              >
                {transaction.amount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            }
          />
          <DetailRow
            label="Data"
            value={format(
              new Date(transaction.date),
              "dd 'de' MMMM 'de' yyyy",
              { locale: ptBR }
            )}
          />
          {account && <DetailRow label="Conta" value={account.name} />}
          {category && <DetailRow label="Categoria" value={category.name} />}
          {paymentMethod && (
            <DetailRow label="Forma de Pagamento" value={paymentMethod.name} />
          )}
          {transaction.interestPaid && transaction.interestPaid > 0 && (
            <DetailRow
              label="Juros/Multa Pagos"
              value={
                <span className="text-orange-500">
                  {transaction.interestPaid.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              }
            />
          )}
        </div>

        {installment && (
          <Button variant="outline" onClick={handleGoToInstallment}>
            <Icon icon="mdi:file-document-outline" className="mr-2 h-4 w-4" />
            Ver Parcela Vinculada
          </Button>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
