"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonBack } from "@/components/ui/button-back";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DebtDetailsViewProps {
  debtId: string;
}

export function DebtDetailsView({ debtId }: DebtDetailsViewProps) {
  const router = useRouter();
  const { debts, debtInstallments, loadingFinanceData, errorFinanceData } =
    useFinance();
  const [currentDebt, setCurrentDebt] = useState<Debt | undefined>(undefined);
  const [filteredInstallments, setFilteredInstallments] = useState<
    DebtInstallment[]
  >([]);

  console.log("DebtDetailsView: Renderizando. debtId da URL:", debtId);
  console.log(
    "DebtDetailsView: loadingFinanceData:",
    loadingFinanceData,
    "errorFinanceData:",
    errorFinanceData
  );
  console.log(
    "DebtDetailsView: Quantidade de dívidas carregadas:",
    debts.length,
    "Quantidade de parcelas carregadas:",
    debtInstallments.length
  );
  console.log(
    "DebtDetailsView: Conteúdo completo das dívidas (para depuração):",
    debts
  );

  useEffect(() => {
    console.log(
      "DebtDetailsView useEffect: Disparado. debts.length:",
      debts.length,
      "debtInstallments.length:",
      debtInstallments.length
    );
    if (debts.length > 0 && debtInstallments.length > 0) {
      const debt = debts.find((d) => d.id === debtId);
      console.log(
        "DebtDetailsView useEffect: Resultado da busca pela dívida:",
        debt
      );
      setCurrentDebt(debt);
      const installments = debtInstallments.filter(
        (inst) => inst.debtId === debtId
      );
      console.log(
        "DebtDetailsView useEffect: Parcelas filtradas para esta dívida:",
        installments.length
      );
      setFilteredInstallments(installments);
    } else if (!loadingFinanceData && !errorFinanceData) {
      console.warn(
        `DebtDetailsView: Dívida com ID ${debtId} não encontrada OU nenhum dado de dívida/parcela carregado.`
      );
    }
  }, [debtId, debts, debtInstallments, loadingFinanceData, errorFinanceData]);

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando detalhes da dívida...
        </p>
      </div>
    );
  }

  if (errorFinanceData) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Erro ao carregar dados: {errorFinanceData}</p>
      </div>
    );
  }

  if (!currentDebt) {
    return (
      <div className="text-center p-4">
        <p className="text-lg text-red-500">Dívida não encontrada.</p>
        <ButtonBack onClick={() => router.back()} className="mt-4">
          Voltar
        </ButtonBack>
      </div>
    );
  }

  const getInstallmentStatusColor = (status: DebtInstallment["status"]) => {
    switch (status) {
      case "paid":
        return "text-green-500";
      case "overdue":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{currentDebt.description}</h1>
        <div className="w-10 h-10"></div>
        <ButtonBack onClick={() => router.back()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da Dívida</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p>
            <strong>Tipo:</strong> {currentDebt.type}
          </p>
          <p>
            <strong>Valor Original:</strong> R${" "}
            {currentDebt.originalAmount?.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          {!currentDebt.isRecurring && (
            <>
              <p>
                <strong>Saldo Atual:</strong> R${" "}
                {currentDebt.currentOutstandingBalance?.toLocaleString(
                  "pt-BR",
                  { minimumFractionDigits: 2 }
                )}
              </p>
              <p>
                <strong>Juros Pagos (Total):</strong> R${" "}
                {currentDebt.totalInterestPaidOnThisDebt?.toLocaleString(
                  "pt-BR",
                  { minimumFractionDigits: 2 }
                )}
              </p>
              <p>
                <strong>Multas Pagas (Total):</strong> R${" "}
                {currentDebt.totalFinePaidOnThisDebt?.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              {currentDebt.totalInstallments && (
                <p>
                  <strong>Parcelas Pagas:</strong>{" "}
                  {currentDebt.paidInstallments}/{currentDebt.totalInstallments}
                </p>
              )}
              <p>
                <strong>Taxa de Juros:</strong> {currentDebt.interestRate}%
              </p>
              <p>
                <strong>Taxa de Multa:</strong> {currentDebt.fineRate}%
              </p>
              <p>
                <strong>Valor da Parcela:</strong> R${" "}
                {currentDebt.expectedInstallmentAmount?.toLocaleString(
                  "pt-BR",
                  { minimumFractionDigits: 2 }
                )}
              </p>
              <p>
                <strong>Data de Término:</strong>{" "}
                {currentDebt.endDate
                  ? format(new Date(currentDebt.endDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "N/A"}
              </p>
            </>
          )}
          <p>
            <strong>Data de Início:</strong>{" "}
            {format(new Date(currentDebt.startDate), "dd/MM/yyyy", {
              locale: ptBR,
            })}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {currentDebt.isActive ? "Ativa" : "Quitada"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInstallments.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhuma parcela encontrada para esta dívida.
            </p>
          ) : (
            <div className="grid gap-4">
              {filteredInstallments.map((installment) => (
                <Card key={installment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">
                        {installment.installmentNumber
                          ? `Parcela ${installment.installmentNumber}`
                          : `Ocorrência`}
                      </p>
                      <p
                        className={`font-medium ${getInstallmentStatusColor(
                          installment.status
                        )}`}
                      >
                        {installment.status === "paid"
                          ? "Paga"
                          : installment.status === "overdue"
                          ? "Atrasada"
                          : "Pendente"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vencimento:{" "}
                      {format(
                        new Date(installment.expectedDueDate),
                        "dd/MM/yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    <p className="text-sm">
                      Valor Esperado: R${" "}
                      {installment.expectedAmount?.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    {installment.actualPaidAmount !== null && (
                      <p className="text-sm">
                        Valor Pago: R${" "}
                        {installment.actualPaidAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    )}
                    {installment.interestPaidOnInstallment !== null &&
                      installment.interestPaidOnInstallment > 0 && (
                        <p className="text-sm text-red-400">
                          Juros Pagos: R${" "}
                          {installment.interestPaidOnInstallment.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </p>
                      )}
                    {installment.finePaidOnInstallment !== null &&
                      installment.finePaidOnInstallment > 0 && (
                        <p className="text-sm text-red-400">
                          Multa Paga: R${" "}
                          {installment.finePaidOnInstallment.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </p>
                      )}
                    {installment.paymentDate && (
                      <p className="text-xs text-muted-foreground">
                        Data Pagamento:{" "}
                        {format(
                          new Date(installment.paymentDate),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
