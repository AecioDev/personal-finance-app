"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/components/providers/finance-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { ButtonNew } from "@/components/ui/button-new";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { getDDMMYYYY } from "@/lib/dates";
import { Debt } from "@/interfaces/finance";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [displayDate, setDisplayDate] = useState(new Date());

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  const getCategoryIcon = (categoryId?: string) => {
    if (!categoryId) return "mdi:tag-outline";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || "mdi:help-circle-outline";
  };

  const getDebtStatus = (
    debt: Debt
  ): {
    text: string;
    variant: "default" | "secondary" | "destructive" | "warning";
    key: StatusFilter;
  } => {
    if (!debt.isActive) {
      return { text: "Finalizada", variant: "secondary", key: "finished" };
    }
    if ((debt.totalPaidOnThisDebt || 0) > 0) {
      return { text: "Em Andamento", variant: "default", key: "inProgress" };
    }
    return { text: "Em Aberto", variant: "warning", key: "open" };
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
  const formattedDate = format(displayDate, "MMMM 'de' yyyy", {
    locale: ptBR,
  });

  if (loadingFinanceData) {
    return <div className="p-4 text-center">Carregando dívidas...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <ButtonBack onClick={() => router.back()} />
          <h1 className="text-2xl font-bold">Minhas Dívidas</h1>
          <ButtonNew onClick={() => router.push("/new-debt")}>
            Nova Dívida
          </ButtonNew>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between p-2 rounded-md bg-background/50">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <Icon icon="mdi:chevron-left" className="h-6 w-6" />
              </Button>
              <span className="font-semibold text-center capitalize">
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
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(value: StatusFilter) =>
                value && setStatusFilter(value)
              }
              className="justify-center"
            >
              <ToggleGroupItem value="all">Todas</ToggleGroupItem>
              <ToggleGroupItem value="open">Em Aberto</ToggleGroupItem>
              <ToggleGroupItem value="inProgress">Em Andamento</ToggleGroupItem>
              <ToggleGroupItem value="finished">Finalizadas</ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

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
          <div className="grid gap-4">
            {filteredDebts.map((debt) => {
              const status = getDebtStatus(debt);

              const installmentForMonth = debtInstallments.find(
                (inst) =>
                  inst.debtId === debt.id &&
                  getMonth(new Date(inst.expectedDueDate)) ===
                    getMonth(displayDate) &&
                  getYear(new Date(inst.expectedDueDate)) ===
                    getYear(displayDate)
              );

              const lastPaymentDate = !debt.isActive
                ? debtInstallments
                    .filter(
                      (inst) => inst.debtId === debt.id && inst.paymentDate
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.paymentDate!).getTime() -
                        new Date(a.paymentDate!).getTime()
                    )[0]?.paymentDate
                : null;

              return (
                <Link
                  key={debt.id}
                  href={`/debts/${debt.id}`}
                  className="block"
                >
                  <Card
                    className={
                      debt.isActive
                        ? "hover:bg-muted/50 transition-colors cursor-pointer"
                        : "opacity-70"
                    }
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon
                          icon={getCategoryIcon(debt.categoryId)}
                          className="w-5 h-5 text-primary"
                        />
                      </div>

                      <div className="min-w-0 flex-grow">
                        <h3 className="text-lg font-semibold truncate">
                          {debt.description}
                        </h3>

                        <div className="text-sm text-muted-foreground mt-2 space-y-1">
                          <p>
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
                          <p>
                            {!debt.isActive
                              ? "Finalizada em: "
                              : "Vencimento: "}
                            <span className="font-semibold text-foreground">
                              {!debt.isActive && lastPaymentDate
                                ? getDDMMYYYY(lastPaymentDate)
                                : getDDMMYYYY(
                                    installmentForMonth?.expectedDueDate ||
                                      debt.startDate
                                  )}
                            </span>
                          </p>
                        </div>

                        <div className="mt-2">
                          <Badge variant={status.variant}>{status.text}</Badge>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Icon
                          icon="mdi:eye"
                          className="w-5 h-5 text-muted-foreground"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
