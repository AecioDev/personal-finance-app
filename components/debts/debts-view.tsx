"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/components/providers/finance-provider";
import { useModal } from "@/components/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/use-toast";
import { Debt } from "@/interfaces/finance";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatedTabs } from "../ui/animated-tabs";
import { PageViewLayout } from "../layout/page-view-layout"; // 1. Importando nosso novo layout
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "open" | "inProgress" | "finished";

export function DebtsView() {
  const router = useRouter();
  const {
    debts,
    debtInstallments,
    categories,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();
  const { setCustomActions } = useModal();

  useEffect(() => {
    setCustomActions([
      {
        label: "Nova Dívida",
        icon: "mdi:credit-card-plus-outline",
        action: () => router.push("/new-debt"),
      },
    ]);

    return () => setCustomActions([]);
  }, [setCustomActions, router]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [displayDate, setDisplayDate] = useState(new Date());

  const getCategoryIcon = (categoryId?: string) => {
    if (!categoryId) return "mdi:tag-outline";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || "mdi:help-circle-outline";
  };

  const getDebtStatus = (
    debt: Debt
  ): {
    text: string;
    variant: "complete" | "progress" | "warning";
    key: StatusFilter;
  } => {
    if (!debt.isActive) {
      return { text: "Finalizada", variant: "complete", key: "finished" };
    }
    if ((debt.totalPaidOnThisDebt || 0) > 0) {
      return { text: "Andamento", variant: "progress", key: "inProgress" };
    }
    return { text: "Aberta", variant: "warning", key: "open" };
  };

  const filteredDebts = useMemo(() => {
    const selectedMonth = getMonth(displayDate);
    const selectedYear = getYear(displayDate);

    const debtIdsInMonth = new Set<string>();
    debtInstallments.forEach((inst) => {
      const dueDate = new Date(inst.expectedDueDate);
      if (
        getMonth(dueDate) === selectedMonth &&
        getYear(dueDate) === selectedYear
      ) {
        debtIdsInMonth.add(inst.debtId);
      }
    });

    return debts
      .filter((debt) => {
        if (debtIdsInMonth.size === 0) return false;
        const matchesDate = debtIdsInMonth.has(debt.id);
        if (!matchesDate) return false;

        const matchesSearch = debt.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (statusFilter === "all") return true;
        const statusKey = getDebtStatus(debt).key;
        return statusKey === statusFilter;
      })
      .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));
  }, [debts, debtInstallments, searchTerm, statusFilter, displayDate]);

  const handlePreviousMonth = () => setDisplayDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setDisplayDate((d) => addMonths(d, 1));
  const formattedDate = format(displayDate, "MMMM", {
    locale: ptBR,
  });

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

  return (
    // 2. Usando o PageViewLayout como container principal
    <PageViewLayout title="Minhas Dívidas">
      {/* 3. Todo o conteúdo da página vai aqui dentro como children */}

      {/* Card de Filtros */}
      <Card className="rounded-[2rem] shadow-md bg-primary text-primary-foreground">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center text-primary-foreground">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <Icon icon="mdi:chevron-left" className="h-6 w-6" />
            </Button>
            <span className="font-bold text-lg uppercase tracking-wider">
              {formattedDate}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <Icon icon="mdi:chevron-right" className="h-6 w-6" />
            </Button>
          </div>

          <div className="relative">
            <Icon
              icon="mdi:magnify"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Pesquisar por descrição..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AnimatedTabs
            defaultValue={statusFilter}
            onValueChange={(value) => setStatusFilter(value as any)}
            tabs={[
              { label: "Abertas", value: "open" },
              { label: "Andamento", value: "inProgress" },
              { label: "Finalizadas", value: "finished" },
              { label: "Todas", value: "all" },
            ]}
            tabClassName="text-xs"
            layoutId="debts-status-filter"
          />
        </CardContent>
      </Card>

      {/* Lista de Dívidas */}
      {filteredDebts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Icon
              icon="mdi:database-search"
              className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
            />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma dívida encontrada
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou adicione uma nova dívida.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredDebts.map((debt) => {
            const status = getDebtStatus(debt);
            const installmentForMonth = debtInstallments.find(
              (inst) =>
                inst.debtId === debt.id &&
                getMonth(new Date(inst.expectedDueDate)) ===
                  getMonth(displayDate) &&
                getYear(new Date(inst.expectedDueDate)) === getYear(displayDate)
            );

            // Lógica de cores para a "casca", como no modelo
            const statusColor =
              status.key === "finished"
                ? "bg-status-complete"
                : status.key === "inProgress"
                ? "bg-status-in-progress"
                : "bg-warning";
            const textColor =
              status.key === "finished"
                ? "text-status-complete-foreground"
                : status.key === "inProgress"
                ? "text-status-in-progress-foreground"
                : "text-warning-foreground";
            const borderColor =
              status.key === "finished"
                ? "border-status-complete"
                : status.key === "inProgress"
                ? "border-status-in-progress"
                : "border-warning";

            return (
              <Link key={debt.id} href={`/debts/${debt.id}`} className="block">
                <div
                  className={cn(
                    "flex items-center justify-between p-2 rounded-xl bg-background hover:bg-muted/50 cursor-pointer transition-colors border-l-4",
                    borderColor
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                        statusColor
                      )}
                    >
                      <Icon
                        icon={getCategoryIcon(debt.categoryId)}
                        className={cn("w-6 h-6", textColor)}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="font-bold text-base text-foreground truncate">
                        {debt.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valor:{" "}
                        <span className="font-semibold text-foreground">
                          {(
                            installmentForMonth?.expectedAmount ||
                            debt.originalAmount
                          ).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right pl-2">
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageViewLayout>
  );
}
