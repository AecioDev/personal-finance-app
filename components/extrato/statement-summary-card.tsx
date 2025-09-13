// src/components/extrato/statement-summary-card.tsx
"use client";

import React, { useMemo } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { Filters } from "./extrato-filters";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StatementSummaryCardProps {
  entries: FinancialEntry[];
  filters: Filters;
}

export function StatementSummaryCard({
  entries,
  filters,
}: StatementSummaryCardProps) {
  const summary = useMemo(() => {
    const totalPrevisto = entries.reduce(
      (acc, e) => acc + (e.expectedAmount || 0),
      0
    );
    const totalRealizado = entries.reduce(
      (acc, e) => acc + (e.paidAmount || 0),
      0
    );
    const diff = totalRealizado - totalPrevisto;

    return {
      totalPrevisto,
      totalRealizado,
      juros: diff > 0 ? diff : 0,
      descontos: diff < 0 ? Math.abs(diff) : 0,
    };
  }, [entries]);

  return (
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
  );
}
