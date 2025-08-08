// components/dashboard/monthly-summary-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlySummary {
  totalPrevisto: number;
  totalPago: number;
  faltaPagar: number;
}

interface MonthlySummaryCardProps {
  summary: MonthlySummary;
  displayDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function MonthlySummaryCard({
  summary,
  displayDate,
  onPreviousMonth,
  onNextMonth,
}: MonthlySummaryCardProps) {
  // Formata o mês e já o converte para maiúsculas
  const formattedMonth = format(displayDate, "MMMM", {
    locale: ptBR,
  }).toUpperCase();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPreviousMonth}>
          <Icon icon="mdi:chevron-left" className="h-6 w-6" />
        </Button>
        {/* Adicionadas as classes `uppercase` e `font-bold` e a variável formatada */}
        <CardTitle className="text-base text-center sm:text-lg font-bold">
          Resumo de {formattedMonth}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onNextMonth}>
          <Icon icon="mdi:chevron-right" className="h-6 w-6" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Previsto</p>
            <p className="font-bold text-lg">
              {summary.totalPrevisto.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pago</p>
            <p className="font-bold text-lg text-green-500">
              {summary.totalPago.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Falta</p>
            <p className="font-bold text-lg text-red-500">
              {summary.faltaPagar.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
