"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/components/providers/finance-provider";
import { useModal } from "@/components/providers/modal-provider"; // Importando o useModal
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
  const { setCustomActions } = useModal(); // Pegando a função para setar ações

  // Efeito para registrar e limpar a ação customizada desta página
  useEffect(() => {
    setCustomActions([
      {
        label: "Nova Dívida",
        icon: "mdi:credit-card-plus-outline",
        action: () => router.push("/new-debt"),
      },
    ]);

    // Função de limpeza: quando o componente desmontar, limpa as ações
    return () => setCustomActions([]);
  }, [setCustomActions, router]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [displayDate, setDisplayDate] = useState(new Date());

  // ... (toda a sua lógica de filtros e status continua a mesma)
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
    <div className="bg-primary">
      <div className="flex h-56 flex-col text-primary-foreground">
        {/* Linha superior apenas com o botão de voltar */}
        <div className="flex-shrink-0 p-4">
          <Icon
            icon="mdi:arrow-left"
            onClick={() => router.back()}
            className="h-6 w-6 cursor-pointer"
          />
        </div>
        {/* Container do título para centralização perfeita */}
        <div className="flex flex-grow items-center justify-center -mt-14">
          <h1 className="text-3xl font-semibold">Minhas Dívidas</h1>
        </div>
      </div>

      {/* Container Branco Curvado com margem negativa para sobrepor */}
      <div className="rounded-t-[2.5rem] bg-background space-y-4 p-4">
        {/* Card de Filtros */}
        <Card className="bg-surface">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between p-2 rounded-md">
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
                  getYear(new Date(inst.expectedDueDate)) ===
                    getYear(displayDate)
              );

              return (
                <Link
                  key={debt.id}
                  href={`/debts/${debt.id}`}
                  className="block"
                >
                  <Card
                    className={
                      "hover:bg-muted/50 transition-colors cursor-pointer"
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
                        <h3 className="font-semibold truncate">
                          {debt.description}
                        </h3>
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
                      <div className="flex-shrink-0">
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
