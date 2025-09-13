// src/components/extrato/extrato-view.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { ExtratoFilters, Filters } from "./extrato-filters";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { Icon } from "@iconify/react";

export function FinancialStatement() {
  const { financialEntries, categories } = useFinance();
  const [view, setView] = useState<"extrato" | "comparativo">("extrato");

  const [filters, setFilters] = useState<Filters>({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    type: "all",
    status: "all",
    accountId: "all",
    categoryId: "all",
  });

  const filteredEntries = useMemo(() => {
    return financialEntries
      .filter((entry) => {
        const entryDate = new Date(entry.dueDate);
        const from = filters.dateFrom ? startOfDay(filters.dateFrom) : null;
        const to = filters.dateTo ? endOfDay(filters.dateTo) : null;

        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;
        if (filters.type !== "all" && entry.type !== filters.type) return false;
        if (
          filters.status !== "all" &&
          (filters.status === "paid"
            ? entry.status !== "paid"
            : entry.status === "paid")
        )
          return false;
        if (
          filters.accountId !== "all" &&
          entry.accountId !== filters.accountId
        )
          return false;
        if (
          filters.categoryId !== "all" &&
          entry.categoryId !== filters.categoryId
        )
          return false;

        return true;
      })
      .sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      );
  }, [financialEntries, filters]);

  const summary = useMemo(() => {
    const totalPrevisto = filteredEntries.reduce(
      (acc, e) => acc + (e.expectedAmount || 0),
      0
    );
    const totalRealizado = filteredEntries.reduce(
      (acc, e) => acc + (e.paidAmount || 0),
      0
    );
    const diff = totalRealizado - totalPrevisto;

    return {
      totalPrevisto,
      totalRealizado,
      juros: diff > 0 ? diff : 0,
      descontos: diff < 0 ? Math.abs(diff) : 0,
      saldo: totalRealizado,
    };
  }, [filteredEntries]);

  // 🔹 Agrupa por dia
  const groupedByDay = useMemo(() => {
    const groups: Record<string, FinancialEntry[]> = {};
    filteredEntries.forEach((entry) => {
      const day = format(new Date(entry.dueDate), "yyyy-MM-dd");
      if (!groups[day]) groups[day] = [];
      groups[day].push(entry);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [filteredEntries]);

  // 🔹 Agrupa por mês (para o comparativo)
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, FinancialEntry[]> = {};
    filteredEntries.forEach((entry) => {
      const month = format(new Date(entry.dueDate), "yyyy-MM");
      if (!groups[month]) groups[month] = [];
      groups[month].push(entry);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [filteredEntries]);

  // helper para pegar ícone da categoria
  const getCategoryIcon = (id?: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.icon || "mdi:tag-outline";
  };

  return (
    <div className="space-y-6">
      <ExtratoFilters onFilterChange={setFilters} />

      {/* Toggle Visão */}
      <div className="flex gap-2">
        <Button
          variant={view === "extrato" ? "default" : "outline"}
          onClick={() => setView("extrato")}
        >
          Extrato
        </Button>
        <Button
          variant={view === "comparativo" ? "default" : "outline"}
          onClick={() => setView("comparativo")}
        >
          Previsto x Realizado
        </Button>
      </div>

      {/* Resumo do Período */}
      <Card className="rounded-[2rem] shadow-md bg-muted border border-primary text-primary-foreground">
        <CardHeader className="flex items-center justify-center pb-2">
          <CardTitle className="text-xl font-bold">Resumo do Período</CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            {filters.dateFrom && filters.dateTo
              ? `${format(filters.dateFrom, "dd/MM/yyyy")} - ${format(
                  filters.dateTo,
                  "dd/MM/yyyy"
                )}`
              : "Período não definido"}
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Previsto</p>
            <p className="font-bold">
              {summary.totalPrevisto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Realizado</p>
            <p className="font-bold">
              {summary.totalRealizado.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Juros</p>
            <p className="font-bold text-red-600">
              {summary.juros.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Descontos</p>
            <p className="font-bold text-green-600">
              {summary.descontos.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Extrato Normal */}
      {view === "extrato" && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Extrato</h3>
          <div className="space-y-6">
            {groupedByDay.map(([day, entries]) => {
              const totalDia = entries.reduce(
                (acc, e) =>
                  acc +
                  (e.type === "income"
                    ? e.paidAmount || 0
                    : -(e.paidAmount || 0)),
                0
              );
              return (
                <div
                  key={day}
                  className="space-y-2 border-b-2 border-primary/30 pb-4"
                >
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {format(new Date(day), "dd 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <div className="space-y-2">
                    {entries.map((e) => (
                      <div
                        key={e.id}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            icon={getCategoryIcon(e.categoryId)}
                            className="w-4 h-4 text-muted-foreground"
                          />
                          <span>{e.description}</span>
                        </div>
                        <span
                          className={cn(
                            "",
                            e.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {e.type === "income" ? "+" : "-"}{" "}
                          {(e.paidAmount ?? e.expectedAmount).toLocaleString(
                            "pt-BR",
                            { style: "currency", currency: "BRL" }
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-semibold pt-1">
                    <span>Saldo do dia</span>
                    <span
                      className={cn(
                        totalDia >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {totalDia.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Previsto x Realizado */}
      {view === "comparativo" && (
        <div className="overflow-x-auto space-y-6">
          {groupedByMonth.map(([month, entries]) => (
            <div key={month}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                {format(new Date(month + "-01"), "MMMM/yyyy", { locale: ptBR })}
              </h4>
              <table className="min-w-[700px] w-full text-sm border mb-6">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-center p-2">Dia</th>
                    <th className="text-left p-2 w-1/3">Descrição</th>
                    <th className="text-right p-2">Previsto</th>
                    <th className="text-right p-2">Realizado</th>
                    <th className="text-right p-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const diff = (e.paidAmount ?? 0) - (e.expectedAmount ?? 0);
                    return (
                      <tr key={e.id} className="border-t">
                        {/* Dia */}
                        <td className="p-2 text-center">
                          {format(new Date(e.dueDate), "dd")}
                        </td>
                        {/* Descrição */}
                        <td className="p-2 flex items-center gap-2">
                          <Icon
                            icon={getCategoryIcon(e.categoryId)}
                            className="w-4 h-4 text-muted-foreground"
                          />
                          {e.description}
                        </td>
                        {/* Previsto */}
                        <td className="text-right p-2">
                          {e.expectedAmount?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        {/* Realizado */}
                        <td className="text-right p-2">
                          {e.paidAmount?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        {/* Resultado */}
                        <td
                          className={cn(
                            "text-right p-2 font-medium",
                            diff > 0
                              ? "text-red-600"
                              : diff < 0
                              ? "text-green-600"
                              : "text-gray-600"
                          )}
                        >
                          {(e.paidAmount ?? 0) > 0 && (
                            <>
                              {diff > 0 &&
                                `+ ${diff.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}`}
                              {diff < 0 &&
                                `- ${Math.abs(diff).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}`}
                              {diff === 0 &&
                                `${diff.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}`}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
