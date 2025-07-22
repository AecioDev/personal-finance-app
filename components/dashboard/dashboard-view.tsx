"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { TransactionList } from "./transaction-list";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { DebtInstallment } from "@/interfaces/finance";
import { differenceInDays, isPast, isFuture, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DebtPaymentModal } from "@/components/debts/debt-payment-modal";

export function DashboardView() {
  const { toast } = useToast();
  const router = useRouter();
  const {
    accounts,
    transactions,
    debts,
    debtInstallments,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDebts: DebtInstallment[] = [];
  const overdueDebts: DebtInstallment[] = [];

  debtInstallments.forEach((installment) => {
    const dueDate = parseISO(installment.expectedDueDate);
    if (installment.status === "paid") {
      return;
    }
    if (isPast(dueDate) && differenceInDays(today, dueDate) > 0) {
      overdueDebts.push(installment);
    } else if (isFuture(dueDate) || differenceInDays(dueDate, today) === 0) {
      upcomingDebts.push(installment);
    }
  });

  overdueDebts.sort(
    (a, b) =>
      parseISO(a.expectedDueDate).getTime() -
      parseISO(b.expectedDueDate).getTime()
  );
  upcomingDebts.sort(
    (a, b) =>
      parseISO(a.expectedDueDate).getTime() -
      parseISO(b.expectedDueDate).getTime()
  );

  const nextDebtToPayInstallment =
    upcomingDebts.length > 0
      ? upcomingDebts[0]
      : overdueDebts.length > 0
      ? overdueDebts[0]
      : null;
  const nextDebtToPay = nextDebtToPayInstallment
    ? debts.find((d) => d.id === nextDebtToPayInstallment.debtId)
    : null;

  const getDebtStatusColor = (installment: DebtInstallment) => {
    const dueDate = parseISO(installment.expectedDueDate);
    const daysDiff = differenceInDays(today, dueDate);

    if (installment.status === "paid") {
      return "bg-green-600 text-white";
    }
    if (isPast(dueDate) && daysDiff > 0) {
      if (daysDiff >= 30) return "bg-red-700 text-white";
      if (daysDiff >= 15) return "bg-red-600 text-white";
      return "bg-red-500 text-white";
    }
    if (isFuture(dueDate) || daysDiff === 0) {
      if (daysDiff <= 7) return "bg-yellow-500 text-black";
      if (daysDiff <= 30) return "bg-yellow-400 text-black";
      return "bg-green-500 text-white";
    }
    return "bg-gray-500 text-white";
  };

  const handleInformPayment = (installmentId: string) => {
    setSelectedInstallmentId(installmentId);
    setIsPaymentModalOpen(true);
  };

  const recentTransactionsFiltered = transactions
    .filter((t) => t.type === "expense" || t.type === "income")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando dados financeiros...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Próxima Dívida a Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            {nextDebtToPayInstallment && nextDebtToPay ? (
              <div>
                <p className="text-2xl font-bold">
                  {nextDebtToPay.description}
                </p>
                <p className="text-xl">
                  R${" "}
                  {nextDebtToPayInstallment.expectedAmount?.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                <p className="text-sm">
                  Vence em:{" "}
                  {format(
                    parseISO(nextDebtToPayInstallment.expectedDueDate),
                    "dd/MM/yyyy",
                    { locale: ptBR }
                  )}
                </p>
                <Button
                  onClick={() =>
                    handleInformPayment(nextDebtToPayInstallment.id)
                  }
                  className="mt-4 w-full bg-white text-primary hover:bg-gray-100"
                >
                  Informar Pagamento
                </Button>
              </div>
            ) : (
              <p className="text-lg">Nenhuma dívida próxima a vencer.</p>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Dicas de Economia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <Icon
                  icon="mdi:lightbulb-on-outline"
                  className="inline-block w-4 h-4 mr-1"
                />
                Crie um orçamento e siga-o rigorosamente.
              </p>
              <p className="text-sm text-muted-foreground">
                <Icon
                  icon="mdi:lightbulb-on-outline"
                  className="inline-block w-4 h-4 mr-1"
                />
                Priorize o pagamento de dívidas com juros mais altos.
              </p>
              <p className="text-sm text-muted-foreground">
                <Icon
                  icon="mdi:lightbulb-on-outline"
                  className="inline-block w-4 h-4 mr-1"
                />
                Evite compras por impulso e use a regra das 24 horas.
              </p>
              <Button variant="link" className="p-0 h-auto text-primary">
                Ver mais dicas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => router.push("/new-transaction?type=expense")}
          className="h-16 flex-col gap-2 bg-red-500 hover:bg-red-600 text-white"
        >
          <Icon icon="mdi:minus" className="w-6 h-6" />
          Lançamento de Despesa
        </Button>
        <Button
          onClick={() => router.push("/new-transaction?type=income")}
          className="h-16 flex-col gap-2 bg-green-500 hover:bg-green-600 text-white"
        >
          <Icon icon="mdi:plus" className="w-6 h-6" />
          Lançamento de Receita
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {overdueDebts.length > 0 && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg text-red-500">
                Dívidas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 max-h-[25rem] overflow-y-auto">
              {overdueDebts.map((installment) => {
                const debt = debts.find((d) => d.id === installment.debtId);
                return debt ? (
                  <div
                    key={installment.id}
                    className={`p-3 rounded-md flex justify-between items-center ${getDebtStatusColor(
                      installment
                    )}`}
                  >
                    <div>
                      <p className="font-semibold">{debt.description}</p>
                      <p className="text-sm">
                        Venceu em:{" "}
                        {format(
                          parseISO(installment.expectedDueDate),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="font-bold">
                        R${" "}
                        {installment.expectedAmount?.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInformPayment(installment.id)}
                        className="mt-1 text-white hover:bg-white/20 border border-white/50" // Adicionada borda aqui
                      >
                        Pagar
                      </Button>
                    </div>
                  </div>
                ) : null;
              })}
            </CardContent>
          </Card>
        )}

        {upcomingDebts.length > 0 && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-500">
                Dívidas para Vencer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 max-h-[25rem] overflow-y-auto">
              {upcomingDebts.map((installment) => {
                const debt = debts.find((d) => d.id === installment.debtId);
                return debt ? (
                  <div
                    key={installment.id}
                    className={`p-3 rounded-md flex justify-between items-center ${getDebtStatusColor(
                      installment
                    )}`}
                  >
                    <div>
                      <p className="font-semibold">{debt.description}</p>
                      <p className="text-sm">
                        Vence em:{" "}
                        {format(
                          parseISO(installment.expectedDueDate),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="font-bold">
                        R${" "}
                        {installment.expectedAmount?.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInformPayment(installment.id)}
                        className="mt-1 text-white hover:bg-white/20 border border-white/50" // Adicionada borda aqui
                      >
                        Pagar
                      </Button>
                    </div>
                  </div>
                ) : null;
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:history" className="w-5 h-5" />
            Últimos Lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={recentTransactionsFiltered}
            accounts={accounts}
          />
        </CardContent>
      </Card>

      {/* Modal de Pagamento de Dívida */}
      <DebtPaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        installmentToPayId={selectedInstallmentId}
      />
    </div>
  );
}
