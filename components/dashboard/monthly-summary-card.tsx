// components/dashboard/monthly-summary-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // 1. Importar o Progress
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
  // 2. Calcular o valor do progresso
  const progressValue =
    summary.totalPrevisto > 0
      ? (summary.totalPago / summary.totalPrevisto) * 100
      : 0;

  return (
    // 3. Ajustar o estilo do Card principal
    <Card className="rounded-[2rem] shadow-md">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center text-primary">
          <Button variant="ghost" size="icon" onClick={onPreviousMonth}>
            <Icon icon="mdi:chevron-left" className="h-6 w-6" />
          </Button>
          <p className="font-bold text-lg uppercase tracking-wider">
            {format(displayDate, "MMMM", { locale: ptBR })}
          </p>
          <Button variant="ghost" size="icon" onClick={onNextMonth}>
            <Icon icon="mdi:chevron-right" className="h-6 w-6" />
          </Button>
        </div>

        {/* 4. Adicionar a barra de progresso e os textos de meta */}
        <div>
          <Progress
            value={progressValue}
            className="h-4 bg-amber-300 [&>div]:bg-input"
          />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>{progressValue.toFixed(0)}% pago</span>
            <span>
              Meta:{" "}
              {summary.totalPrevisto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>

        {/* 5. Ajustar o grid e as cores dos valores */}
        <div className="grid grid-cols-3 text-center divide-x divide-border">
          <div>
            <p className="text-xs text-muted">Previsto</p>
            <p className="font-bold text-base text-foreground">
              {summary.totalPrevisto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Pago</p>
            <p className="font-bold text-base text-accent">
              {summary.totalPago.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Falta</p>
            <p className="font-bold text-base text-amber-300">
              {summary.faltaPagar.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
