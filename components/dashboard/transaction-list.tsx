"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Account,
  Transaction,
  Debt,
  DebtInstallment,
} from "@/interfaces/finance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/button";
import { SimpleTooltip } from "../common/simple-tooltip";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  onViewTransaction: (transaction: Transaction) => void;
}

export function TransactionList({
  transactions,
  accounts,
  onViewTransaction,
}: TransactionListProps) {
  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.name || "N/A";
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon
          icon="mdi:receipt-text-outline"
          className="w-12 h-12 mx-auto mb-2 opacity-50"
        />
        <p>Nenhum lançamento encontrado para este mês.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[25rem] overflow-y-auto pr-2">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === "income";
        return (
          <div
            key={transaction.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              isIncome
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
            )}
          >
            {/* Lado Esquerdo com as Informações no Novo Layout */}
            <div className="flex flex-col">
              <p
                className={cn(
                  "font-semibold leading-tight",
                  isIncome
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {isIncome ? "Recebimento: " : "Pagamento: "}
                {transaction.amount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              <p className="font-medium leading-tight text-foreground/90">
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

            {/* Lado Direito apenas com o Botão */}
            <div className="flex items-center">
              <SimpleTooltip label="Visualizar Detalhes">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 h-auto"
                  onClick={() => onViewTransaction(transaction)}
                >
                  <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                </Button>
              </SimpleTooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
