// components/dashboard/monthly-summary-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "next-themes";
import { cn, formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Tipagem para os dados do resumo que virão do hook
interface SummaryData {
  previsto: number;
  realizado: number;
  saldo: number;
}

interface MonthlySummary {
  receitas: SummaryData;
  despesas: SummaryData;
  resultado: SummaryData;
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
  const isMobile = useIsMobile();

  const progressValue =
    summary.despesas.previsto > 0
      ? (summary.despesas.realizado / summary.despesas.previsto) * 100
      : 0;

  return (
    <Card
      className={cn(
        "rounded-[2rem] shadow-md bg-muted text-muted-foreground border",
        resolvedTheme === "dark" ? "border-primary border-2" : "border-primary"
      )}
    >
      <CardContent className="p-4 space-y-4 font-medium">
        {/* Cabeçalho com navegação de mês */}
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

        {/* Barra de progresso */}
        <div>
          <Progress value={progressValue} className="h-4 bg-background" />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{progressValue.toFixed(0)}% pago</span>
            <span>
              Meta:{" "}
              <span className="text-foreground">
                {formatCurrency(summary.despesas.previsto)}
              </span>
            </span>
          </div>
        </div>

        {/* Tabela Resumo com todos os ajustes */}
        <div className="pt-2 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                <th className="w-1/4 text-left font-semibold"></th>
                <th className="w-1/4 text-center font-semibold px-2">
                  Previsto
                </th>
                <th className="w-1/4 text-center font-semibold px-2">
                  Realizado
                </th>
                <th className="w-1/4 text-center font-semibold px-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {/* RECEITAS */}
              <tr>
                <td className="py-1 font-bold text-accent">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Icon icon="fa6-solid:arrow-trend-up" className="h-5 w-5" />
                    {!isMobile && <span className="truncate">Receitas</span>}
                  </div>
                </td>
                <td className="py-1 text-right font-bold text-lg text-primary-foreground px-2 whitespace-nowrap">
                  {formatCurrency(summary.receitas.previsto)}
                </td>
                <td className="py-1 text-right font-bold text-lg text-accent px-2 whitespace-nowrap">
                  {formatCurrency(summary.receitas.realizado)}
                </td>
                <td
                  className={cn(
                    "py-1 text-right font-bold text-lg px-2 whitespace-nowrap",
                    summary.receitas.saldo < 0
                      ? "text-destructive"
                      : "text-primary-foreground"
                  )}
                >
                  {formatCurrency(summary.receitas.saldo)}
                </td>
              </tr>

              {/* DESPESAS */}
              <tr>
                <td className="py-1 font-bold text-destructive">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Icon
                      icon="fa6-solid:arrow-trend-down"
                      className="h-5 w-5"
                    />
                    {!isMobile && <span className="truncate">Despesas</span>}
                  </div>
                </td>
                <td className="py-1 text-right font-bold text-lg text-primary-foreground px-2 whitespace-nowrap">
                  {formatCurrency(summary.despesas.previsto)}
                </td>
                <td className="py-1 text-right font-bold text-lg text-destructive px-2 whitespace-nowrap">
                  {formatCurrency(summary.despesas.realizado)}
                </td>
                <td
                  className={cn(
                    "py-1 text-right font-bold text-lg px-2 whitespace-nowrap",
                    summary.despesas.saldo < 0
                      ? "text-destructive"
                      : "text-primary-foreground"
                  )}
                >
                  {formatCurrency(summary.despesas.saldo)}
                </td>
              </tr>

              {/* RESULTADO */}
              <tr>
                <td className="py-1 font-bold text-primary">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Icon icon="fa6-solid:scale-balanced" className="h-5 w-5" />
                    {!isMobile && <span className="truncate">Resultado</span>}
                  </div>
                </td>
                <td className="py-1 text-right font-bold text-lg text-primary-foreground px-2 whitespace-nowrap">
                  {formatCurrency(summary.resultado.previsto)}
                </td>
                <td
                  className={cn(
                    "py-1 text-right font-bold text-lg px-2 whitespace-nowrap",
                    summary.resultado.realizado >= 0
                      ? "text-accent"
                      : "text-destructive"
                  )}
                >
                  {formatCurrency(summary.resultado.realizado)}
                </td>
                <td
                  className={cn(
                    "py-1 text-right font-bold text-lg px-2 whitespace-nowrap",
                    summary.resultado.saldo < 0
                      ? "text-destructive"
                      : "text-primary-foreground"
                  )}
                >
                  {formatCurrency(summary.resultado.saldo)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
