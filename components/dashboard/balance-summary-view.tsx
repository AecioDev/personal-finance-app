// components/dashboard/balance-summary-view.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface SummaryData {
  previsto: number;
  realizado: number;
  saldo: number;
}

interface BalanceSummaryViewProps {
  receitas: SummaryData;
  despesas: SummaryData;
  resultado: SummaryData;
}

const SummaryRow = ({
  title,
  data,
  icon,
  colorClass,
}: {
  title: string;
  data: SummaryData;
  icon: string;
  colorClass: string;
}) => (
  <div className="grid grid-cols-4 items-center gap-2 text-center">
    <div
      className={cn(
        "flex items-center justify-start text-left gap-2 font-bold col-span-1",
        colorClass
      )}
    >
      <Icon icon={icon} className="h-5 w-5" />
      <span>{title}</span>
    </div>
    <div className="text-sm font-medium text-muted-foreground">
      {formatCurrency(data.previsto)}
    </div>
    <div className="text-sm font-medium text-muted-foreground">
      {formatCurrency(data.realizado)}
    </div>
    <div className="text-sm font-bold text-foreground">
      {formatCurrency(data.saldo)}
    </div>
  </div>
);

export function BalanceSummaryView({
  receitas,
  despesas,
  resultado,
}: BalanceSummaryViewProps) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-muted-foreground">
          <div className="col-start-2">Previsto</div>
          <div>Realizado</div>
          <div>Saldo</div>
        </div>

        <SummaryRow
          title="Receitas"
          data={receitas}
          icon="fa6-solid:arrow-trend-up"
          colorClass="text-accent"
        />
        <SummaryRow
          title="Despesas"
          data={despesas}
          icon="fa6-solid:arrow-trend-down"
          colorClass="text-destructive"
        />
        <SummaryRow
          title="Resultado"
          data={resultado}
          icon="fa6-solid:scale-balanced"
          colorClass="text-primary"
        />
      </CardContent>
    </Card>
  );
}
