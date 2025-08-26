"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Account, Category, Transaction } from "@/interfaces/finance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onViewTransaction: (transaction: Transaction) => void;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  onViewTransaction,
}: TransactionListProps) {
  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.name || "N/A";
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || "mdi:help-circle-outline";
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Icon
          icon="mdi:receipt-text-outline"
          className="w-16 h-16 mx-auto mb-4 text-primary/50"
        />
        <p className="font-semibold">Nenhum lançamento!</p>
        <p className="text-sm">Não há transações para este mês.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === "income";
        const categoryIcon = getCategoryIcon(transaction.categoryId || "");

        // Definindo as cores com base no tipo de transação
        const statusColor = isIncome ? "bg-green-500" : "bg-destructive";
        const textColor = isIncome ? "text-green-500" : "text-destructive";
        const borderColor = isIncome
          ? "border-green-500"
          : "border-destructive";

        return (
          <div
            key={transaction.id}
            onClick={() => onViewTransaction(transaction)}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl bg-primay hover:bg-muted/50 cursor-pointer transition-colors border-l-4",
              borderColor
            )}
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* Ícone Circular */}
              <div
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                  statusColor
                )}
              >
                <Icon icon={categoryIcon} className="w-6 h-6 text-white" />
              </div>
              {/* Informações da Transação */}
              <div className="flex flex-col min-w-0">
                <p className="font-bold text-base text-foreground truncate">
                  {transaction.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), "dd 'de' MMM", {
                    locale: ptBR,
                  })}
                  {" • "}
                  {getAccountName(transaction.accountId)}
                </p>
              </div>
            </div>

            {/* Valor */}
            <div className="text-right pl-2">
              <p className={cn("font-bold text-lg", textColor)}>
                {transaction.amount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
