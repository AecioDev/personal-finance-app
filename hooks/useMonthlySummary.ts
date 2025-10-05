// hooks/useMonthlySummary.ts
import { useMemo } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { Account } from "@/interfaces/finance";
import { getMonth, getYear, subMonths } from "date-fns";

export function useMonthlySummary(
  financialEntries: FinancialEntry[],
  accounts: Account[],
  displayDate: Date
) {
  const monthlySummary = useMemo(() => {
    const selectedMonthDate = displayDate;
    const previousMonthDate = subMonths(selectedMonthDate, 1);

    const selectedMonth = getMonth(selectedMonthDate);
    const selectedYear = getYear(selectedMonthDate);
    const previousMonth = getMonth(previousMonthDate);
    const previousYear = getYear(previousMonthDate);

    const creditCardAccountIds = accounts
      .filter((acc: Account) => acc.type === "credit_card")
      .map((acc) => acc.id);

    // --- FATURA DO CICLO ANTERIOR ---
    const faturaDoCicloAnterior = financialEntries
      .filter((entry) => {
        const entryDate = new Date(entry.dueDate);
        return (
          getMonth(entryDate) === previousMonth &&
          getYear(entryDate) === previousYear &&
          entry.type === "expense" &&
          !entry.isTransfer &&
          creditCardAccountIds.includes(entry.accountId || "")
        );
      })
      .reduce((acc, e) => acc + e.expectedAmount, 0);

    const entriesInCurrentMonth = financialEntries.filter((entry) => {
      const entryDate = new Date(entry.dueDate);
      return (
        getMonth(entryDate) === selectedMonth &&
        getYear(entryDate) === selectedYear
      );
    });

    // --- CÁLCULOS DE RECEITAS ---
    const receitasDoMes = entriesInCurrentMonth.filter(
      (e) => e.type === "income" && !e.isTransfer
    );

    const totalPrevistoReceitas = receitasDoMes.reduce(
      (acc, e) => acc + e.expectedAmount,
      0
    );
    const totalRealizadoReceitas = receitasDoMes
      .filter((e) => e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);
    const saldoReceitas = totalPrevistoReceitas - totalRealizadoReceitas;

    // --- CÁLCULOS DE DESPESAS ---
    const despesasReaisDoMesAtual = entriesInCurrentMonth.filter(
      (e) => e.type === "expense" && !e.isTransfer
    );
    const totalDespesasReaisDoMesAtual = despesasReaisDoMesAtual.reduce(
      (acc, e) => acc + e.expectedAmount,
      0
    );

    const totalPrevistoDespesas =
      totalDespesasReaisDoMesAtual + faturaDoCicloAnterior;

    const totalPagoDespesasNormais = despesasReaisDoMesAtual
      .filter((e) => e.status === "paid")
      .reduce((acc, e) => acc + (e.paidAmount || 0), 0);

    const pagamentosDeFatura = entriesInCurrentMonth.filter(
      (e) =>
        e.isTransfer &&
        e.type === "income" &&
        creditCardAccountIds.includes(e.accountId || "")
    );
    const totalPagoFaturas = pagamentosDeFatura.reduce(
      (acc, e) => acc + e.expectedAmount,
      0
    );
    const totalRealizadoDespesas = totalPagoDespesasNormais + totalPagoFaturas;
    const saldoDespesas = totalPrevistoDespesas - totalRealizadoDespesas;

    // --- CÁLCULOS DE RESULTADO ---
    const resultadoPrevisto = totalPrevistoReceitas - totalPrevistoDespesas;
    const resultadoRealizado = totalRealizadoReceitas - totalRealizadoDespesas;
    const resultadoSaldo = resultadoPrevisto - resultadoRealizado;

    return {
      receitas: {
        previsto: totalPrevistoReceitas,
        realizado: totalRealizadoReceitas,
        saldo: saldoReceitas,
      },
      despesas: {
        previsto: totalPrevistoDespesas,
        realizado: totalRealizadoDespesas,
        saldo: saldoDespesas,
      },
      resultado: {
        previsto: resultadoPrevisto,
        realizado: resultadoRealizado,
        saldo: resultadoSaldo,
      },
      // Manter os antigos para compatibilidade, se necessário
      totalPrevisto: totalPrevistoDespesas,
      totalPago: totalRealizadoDespesas,
      faltaPagar: saldoDespesas,
      totalReceitas: totalRealizadoReceitas,
      totalDespesas: totalRealizadoDespesas,
    };
  }, [financialEntries, displayDate, accounts]);

  return monthlySummary;
}
