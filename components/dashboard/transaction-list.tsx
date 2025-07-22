"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Account, Transaction } from "@/interfaces/finance";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
}

export function TransactionList({
  transactions,
  accounts,
}: TransactionListProps) {
  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.name || "Conta não encontrada";
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon
          icon="mdi:receipt"
          className="w-12 h-12 mx-auto mb-2 opacity-50"
        />
        <p>Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                transaction.type === "income"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              )}
            >
              <Icon
                icon={
                  transaction.type === "income"
                    ? "mdi:arrow-up"
                    : "mdi:arrow-down"
                }
                className="w-5 h-5"
              />
            </div>
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">
                {getAccountName(transaction.accountId)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "font-semibold",
                transaction.type === "income"
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {transaction.type === "income" ? "+" : "-"}R{" "}
              {transaction.amount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(transaction.date).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
