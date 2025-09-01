"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Debt,
  DebtInstallment,
  DebtInstallmentStatus,
} from "@/interfaces/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { DebtInstallmentModal } from "./debt-installment-modal";
import { getDDMMYYYY } from "@/lib/dates";
import { DebtForm } from "./debt-form";
import { PageViewLayout } from "../layout/page-view-layout";
import { cn, getCalculatedInstallmentStatus } from "@/lib/utils";

interface DebtEditViewProps {
  debtId: string;
}

export function DebtEditView({ debtId }: DebtEditViewProps) {
  const router = useRouter();
  const { debts, debtInstallments, loadingFinanceData } = useFinance();
  const { toast } = useToast();

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<DebtInstallment | null>(null);

  const currentDebt = useMemo(
    () => debts.find((d) => d.id === debtId),
    [debts, debtId]
  );

  const filteredInstallments = useMemo(() => {
    if (!currentDebt) return [];
    return debtInstallments
      .filter((inst) => inst.debtId === currentDebt.id)
      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
  }, [debtInstallments, currentDebt]);

  const getInstallmentBadgeInfo = (status: DebtInstallmentStatus) => {
    switch (status) {
      case "paid":
        return { variant: "complete", text: "Paga" } as const;
      case "overdue":
        return { variant: "destructive", text: "Atrasada" } as const;
      case "partial":
        return { variant: "warning", text: "Parcial" } as const;
      default:
        return { variant: "progress", text: "Pendente" } as const;
    }
  };

  const handleEditInstallment = (installment: DebtInstallment) => {
    setEditingInstallment(installment);
    setIsInstallmentModalOpen(true);
  };

  // Se os dados ainda não carregaram, ou a dívida específica não foi encontrada, mostramos um loading.
  if (loadingFinanceData || !currentDebt) {
    return (
      <div className="p-4 text-center">Carregando dados para edição...</div>
    );
  }

  // Verificamos se a dívida é do tipo 'Completa'. Se não for, redirecionamos.
  // Você pode ajustar essa lógica se o form antigo ainda for usado para outros tipos.
  if (currentDebt.type !== "complete" && !currentDebt.isRecurring) {
    toast({
      title: "Acesso Negado",
      description: "Este tipo de dívida não pode ser editado aqui.",
      variant: "destructive",
    });
    router.push("/debts");
    return null;
  }

  return (
    <PageViewLayout title="Editar Dívida">
      {/* Formulário para editar o cabeçalho da dívida */}
      <DebtForm debtId={debtId} />

      {/* Card para listar e editar as parcelas */}
      <Card className="rounded-[2rem] shadow-md bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Parcelas da Dívida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredInstallments.map((installment) => {
              const instStatus = getCalculatedInstallmentStatus(installment);
              const isPaid = instStatus === "paid";
              const isOverdue = instStatus === "overdue";

              const borderColor = isPaid
                ? "border-green-500"
                : isOverdue
                ? "border-destructive"
                : "border-accent";

              const badgeInfo = getInstallmentBadgeInfo(instStatus);
              const canEdit = instStatus === "pending";

              return (
                <div
                  key={installment.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors border-b-2 border-l-4",
                    borderColor
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-8">
                      <p className="font-semibold truncate">
                        Parcela {installment.installmentNumber}
                      </p>
                      <Badge {...badgeInfo}>{badgeInfo.text}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Venc: {getDDMMYYYY(installment.expectedDueDate)}
                    </p>
                    <p className="text-sm font-medium">
                      {installment.expectedAmount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditInstallment(installment)}
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={setIsInstallmentModalOpen}
        editingInstallment={editingInstallment}
        onDataChange={() => {
          toast({ title: "Parcela atualizada!" });
        }}
      />
    </PageViewLayout>
  );
}
