// components/dashboard/monthly-summary-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // 1. Importar o Progress
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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
  const { resolvedTheme } = useTheme();

  // 2. Calcular o valor do progresso
  const progressValue =
    summary.totalPrevisto > 0
      ? (summary.totalPago / summary.totalPrevisto) * 100
      : 0;

  return (
    <Card className="rounded-[2rem] shadow-md bg-primary text-primary-foreground">
      <CardContent className="p-4 space-y-4 font-medium">
        <div className="flex justify-between items-center text-primary-foreground">
          <Button variant="light" size="icon" onClick={onPreviousMonth}>
            <Icon icon="mdi:chevron-left" className="h-6 w-6" />
          </Button>
          <p className="font-bold text-lg uppercase tracking-wider">
            {format(displayDate, "MMMM", { locale: ptBR })}
          </p>
          <Button variant="light" size="icon" onClick={onNextMonth}>
            <Icon icon="mdi:chevron-right" className="h-6 w-6" />
          </Button>
        </div>
        <div>
          <Progress
            value={progressValue}
            className="h-4 bg-background [&>div]:bg-foreground"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{progressValue.toFixed(0)}% pago</span>
            <span>
              Meta:{" "}
              <span className="text-foreground">
                {summary.totalPrevisto.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 text-center divide-x divide-border">
          <div>
            <p className="text-sm text-muted-foreground">Previsto</p>
            <p className="font-bold text-lg text-primary-foreground">
              {summary.totalPrevisto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pago</p>
            <p className="font-bold text-lg text-accent">
              {summary.totalPago.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Falta</p>
            <p
              className={cn(
                "font-bold text-lg",
                resolvedTheme === "dark"
                  ? "text-destructive"
                  : "text-background"
              )}
            >
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
