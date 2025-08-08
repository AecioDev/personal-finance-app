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

  // --- CÉREBRO DO COMPONENTE ---
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

  // Verifica se existe alguma dívida que precisa de atualização para mostrar o alerta global
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
              {" "}
              {view === "single"
                ? "Parcela vencida mais antiga"
                : "Top 5 Vencidas a mais tempo"}
            </CardTitle>
            {needsAttention && (
              <Icon
                icon="mdi:swap-horizontal"
                className="h-8 w-8 text-yellow-300"
                onClick={() =>
                  setView((v) => (v === "single" ? "list" : "single"))
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {view === "single" ? (
            nextInstallment && nextDebt ? (
              <div>
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
                      {
                        locale: ptBR,
                      }
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-white/20 hover:bg-white/10">
                    <TableHead className="text-white">Descrição</TableHead>
                    <TableHead className="text-white text-center">
                      Juros
                    </TableHead>
                    <TableHead className="text-white text-right">
                      Ações
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.needsUpdate && (
                                <Icon
                                  icon="mdi:alert-circle"
                                  className="h-4 w-4 text-yellow-300"
                                />
                              )}
                              <p>{item.debt.description}</p>
                            </div>
                            <p className="text-xs opacity-70">
                              Venceu em:{" "}
                              {format(
                                new Date(item.installment.expectedDueDate),
                                "dd/MM/yyyy"
                              )}
                            </p>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            R${" "}
                            {(item.debt.currentOutstandingBalance
                              ? item.debt.currentOutstandingBalance -
                                item.debt.originalAmount
                              : 0 - item.debt.originalAmount
                            ).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openUpdateModal(item)}
                            >
                              Atualizar Valor
                            </Button>
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

      {/* O nosso modal sendo renderizado aqui! */}
      <UpdateInstallmentValueModal
        isOpen={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        debt={selectedItemForUpdate?.debt ?? null}
        installment={selectedItemForUpdate?.installment ?? null}
      />
    </>
  );
}
