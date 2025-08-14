// src/components/dashboard/next-due-debt-card.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { SimpleTooltip } from "../common/simple-tooltip";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { UpdateInstallmentValueModal } from "../debts/update-installment-value-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// A interface de dados que o dashboard-view vai nos mandar
interface OverdueDebtInfo {
  debt: Debt | null | undefined;
  installment: DebtInstallment;
  needsUpdate: boolean;
}

interface NextDueDebtCardProps {
  nextDebt: Debt | null;
  nextInstallment: DebtInstallment | null;
  isOverdue: boolean;
  onEditInstallment: (installment: DebtInstallment) => void;
  topOverdueDebts: OverdueDebtInfo[]; // A nova lista
}

export function NextDueDebtCard({
  nextDebt,
  nextInstallment,
  isOverdue,
  onEditInstallment,
  topOverdueDebts,
}: NextDueDebtCardProps) {
  const router = useRouter();

  const [view, setView] = useState<"single" | "list">("single");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItemForUpdate, setSelectedItemForUpdate] =
    useState<OverdueDebtInfo | null>(null);

  const handleGoToPayment = (debtId: string, installmentId: string) => {
    router.push(`/debts/${debtId}/installments/${installmentId}`);
  };

  const openUpdateModal = (item: OverdueDebtInfo) => {
    setSelectedItemForUpdate(item);
    setIsUpdateModalOpen(true);
  };

  const needsAttention = topOverdueDebts.some((item) => item.needsUpdate);

  return (
    <>
      <Card
        className={cn(
          "flex-1 text-white shadow-lg",
          isOverdue
            ? "bg-red-500/30 border border-red-500/20"
            : "bg-green-500/30 border border-green-500/20"
        )}
      >
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {view === "single"
                ? "Parcela vencida mais antiga"
                : "Top 5 Vencidas a mais tempo"}
            </CardTitle>
            {/* O ícone de transição agora só aparece se houverem dívidas na lista */}
            {topOverdueDebts.length > 0 && (
              <SimpleTooltip
                label={
                  view === "single"
                    ? "Ver Lista de Dívidas Críticas"
                    : "Ver Próxima Dívida"
                }
              >
                <Icon
                  icon="mdi:swap-horizontal"
                  className="h-8 w-8 text-yellow-300 cursor-pointer"
                  onClick={() =>
                    setView((v) => (v === "single" ? "list" : "single"))
                  }
                />
              </SimpleTooltip>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {view === "single" ? (
            // VIEW DE ALERTA ÚNICO
            nextInstallment && nextDebt ? (
              <div>
                <div className="flex flex-col md:flex-row justify-between md:items-end">
                  <p className="text-2xl font-bold">{nextDebt.description}</p>
                  {nextDebt.type !== "simple" && (
                    <p className="text-xl">
                      {`Parcela ${nextInstallment.installmentNumber || ""}`}
                    </p>
                  )}
                </div>
                <p className="text-3xl font-bold">
                  R${" "}
                  {nextInstallment.expectedAmount?.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm opacity-90">
                  Vence em:{" "}
                  {format(
                    new Date(nextInstallment.expectedDueDate),
                    "dd/MM/yyyy",
                    { locale: ptBR }
                  )}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleGoToPayment(nextDebt.id, nextInstallment.id)
                    }
                  >
                    <Icon icon="mdi:cash-check" className="w-4 h-4 mr-2" />
                    Pagar
                  </Button>
                  <SimpleTooltip label="Editar Parcela" side="top">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent text-white border-white/50 hover:bg-white/20"
                      onClick={() => onEditInstallment(nextInstallment)}
                    >
                      <Icon icon="mdi:pencil" className="w-4 h-4" />
                    </Button>
                  </SimpleTooltip>
                  <SimpleTooltip label="Ver Dívida" side="top">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent text-white border-white/50 hover:bg-white/20"
                      onClick={() => router.push(`/debts/${nextDebt.id}`)}
                    >
                      <Icon icon="mdi:eye" className="w-4 h-4" />
                    </Button>
                  </SimpleTooltip>
                </div>

                {needsAttention && (
                  <span className="flex items-center justify-center text-sm mt-4">
                    <Icon
                      icon="mdi:alert-circle-outline"
                      className="h-10 w-10 text-yellow-300 mr-2"
                    />
                    <p className="text-center">
                      O valor atual desta parcela não é atualizado há mais de 7
                      dias. Considere atualizar o valor.
                    </p>
                  </span>
                )}
              </div>
            ) : (
              <p className="text-lg">Você está em dia com suas contas!</p>
            )
          ) : (
            // VIEW DE LISTA DETALHADA
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-white/20 hover:bg-white/10">
                    <TableHead className="text-white">Vencimento</TableHead>
                    <TableHead className="text-white">Descrição</TableHead>
                    <TableHead className="text-white text-right">
                      Previsto
                    </TableHead>
                    <TableHead className="text-white text-right">
                      Atual
                    </TableHead>
                    <TableHead className="text-white text-right">
                      Juros
                    </TableHead>
                    <TableHead className="text-white text-right">
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topOverdueDebts.map(
                    (item) =>
                      item.debt && (
                        <TableRow
                          key={item.installment.id}
                          className="border-b-white/20 hover:bg-white/10"
                        >
                          {/* Vencimento */}
                          <TableCell className="font-mono text-sm">
                            {format(
                              new Date(item.installment.expectedDueDate),
                              "dd/MM/yy"
                            )}
                          </TableCell>

                          {/* Descrição */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.needsUpdate && (
                                <SimpleTooltip label="Valor desatualizado">
                                  <Icon
                                    icon="mdi:alert-circle"
                                    className="h-4 w-4 text-yellow-300"
                                  />
                                </SimpleTooltip>
                              )}
                              <p>{item.debt.description}</p>
                            </div>
                          </TableCell>

                          {/* Previsto (Valor Original) */}
                          <TableCell className="text-right font-mono text-sm opacity-80">
                            {item.installment.expectedAmount.toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 }
                            )}
                          </TableCell>

                          {/* Atual (Valor com Juros) */}
                          <TableCell className="text-right font-mono font-semibold">
                            {(
                              item.installment.currentDueAmount ||
                              item.installment.expectedAmount
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>

                          {/* Juros */}
                          <TableCell className="text-right font-mono text-red-400">
                            {(
                              (item.installment.currentDueAmount ||
                                item.installment.expectedAmount) -
                              item.installment.expectedAmount
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>

                          {/* Ação */}
                          <TableCell className="text-right">
                            <Icon
                              icon="mdi:cash-check"
                              className="w-6 h-6"
                              onClick={() => openUpdateModal(item)}
                            />
                          </TableCell>
                        </TableRow>
                      )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UpdateInstallmentValueModal
        isOpen={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        debt={selectedItemForUpdate?.debt ?? null}
        installment={selectedItemForUpdate?.installment ?? null}
      />
    </>
  );
}
