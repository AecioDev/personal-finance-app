"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DebtInstallment, DebtInstallmentStatus } from "@/interfaces/finance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useFinance } from "@/components/providers/finance-provider";
import { DebtInstallmentFormContent } from "./debt-installment-form-content";
import { ConfirmationDialog } from "../common/confirmation-dialog";
import { getDDMMYYYY } from "@/lib/dates";
import { getCalculatedInstallmentStatus } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Icon } from "@iconify/react/dist/iconify.js";

interface DebtInstallmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingInstallment: DebtInstallment | null;
  onDataChange?: () => void;
}

export function DebtInstallmentModal({
  isOpen,
  onOpenChange,
  editingInstallment,
  onDataChange,
}: DebtInstallmentModalProps) {
  const {
    revertInstallmentPayment,
    updateDebtInstallment,
    loadingFinanceData,
  } = useFinance();
  const { toast } = useToast();

  const [isConfirmingRevert, setIsConfirmingRevert] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const handleRevertAndRedirect = async () => {
    if (!editingInstallment) return;

    setIsReverting(true);
    try {
      await revertInstallmentPayment(editingInstallment.id);
      toast({
        title: "Pronto para Edição!",
        description: "Os pagamentos foram estornados com sucesso.",
        variant: "success",
      });

      onDataChange?.();

      setIsConfirmingRevert(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao Estornar",
        description:
          error.message || "Não foi possível preparar a parcela para edição.",
        variant: "destructive",
      });
    } finally {
      setIsReverting(false);
    }
  };

  const handleSaveInstallment = async (
    installmentData: Partial<Omit<DebtInstallment, "id" | "uid" | "createdAt">>
  ) => {
    if (!editingInstallment?.id) {
      throw new Error("ID da parcela ausente para edição.");
    }
    try {
      await updateDebtInstallment(editingInstallment.id, installmentData);
      toast({
        title: "Parcela Atualizada!",
        description: "Os dados da parcela foram salvos com sucesso.",
        variant: "success",
      });

      onDataChange?.();

      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar parcela:", error);
      throw error;
    }
  };

  if (!editingInstallment) {
    return;
  }

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

  const instStatus = getCalculatedInstallmentStatus(editingInstallment);
  const isPaidOrPartial = instStatus === "paid" || instStatus === "partial";

  const badgeInfo = getInstallmentBadgeInfo(instStatus);

  const hasPayments =
    editingInstallment &&
    editingInstallment.transactionIds &&
    editingInstallment.transactionIds.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPaidOrPartial
                ? "Detalhes da Parcela"
                : `Editar Parcela ${editingInstallment?.installmentNumber}`}
            </DialogTitle>
            <DialogDescription>
              {isPaidOrPartial
                ? "Esta parcela já possui pagamentos. Para alterá-la, os pagamentos serão estornados."
                : "Altere os dados da parcela abaixo."}
            </DialogDescription>
          </DialogHeader>

          {isPaidOrPartial ? (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">
                  <Badge variant={badgeInfo.variant}>{badgeInfo.text}</Badge>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimento</span>
                <span className="font-medium">
                  {getDDMMYYYY(editingInstallment.expectedDueDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Previsto</span>
                <span className="font-medium">
                  R${" "}
                  {editingInstallment.expectedAmount > 0
                    ? editingInstallment.expectedAmount.toFixed(2)
                    : "0.00"}
                </span>
              </div>
              {hasPayments && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Pago</span>
                    <span className="font-medium text-green-600">
                      R${" "}
                      {editingInstallment.paidAmount > 0
                        ? editingInstallment.paidAmount.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  {editingInstallment.interestPaidAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Juros Pagos</span>
                      <span className="font-medium text-orange-600">
                        R$ {editingInstallment.interestPaidAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {editingInstallment.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Desconto Recebido
                      </span>
                      <span className="font-medium text-green-600">
                        R$ {editingInstallment.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
              <hr className="border border-1 border-background my-4" />
              <DialogFooter>
                <div className="flex flex-col w-full space-y-4">
                  <Button
                    variant={"warning"}
                    onClick={() => setIsConfirmingRevert(true)}
                    disabled={loadingFinanceData || isReverting}
                  >
                    <Icon icon="mdi:alert" className="w-4 h-4" />
                    Habilitar Edição
                  </Button>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Fechar
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <DebtInstallmentFormContent
              editingInstallment={editingInstallment}
              onSave={handleSaveInstallment}
              loading={loadingFinanceData}
              onClose={() => onOpenChange(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {isPaidOrPartial && (
        <ConfirmationDialog
          isOpen={isConfirmingRevert}
          onOpenChange={setIsConfirmingRevert}
          title="Habilitar Edição"
          description="Tem certeza? Todos os pagamentos desta parcela serão desfeitos e o dinheiro devolvido às contas de origem. Esta ação não pode ser desfeita."
          onConfirm={handleRevertAndRedirect}
          variant="destructive"
          confirmText={isReverting ? "Aguarde..." : "Sim, Habilitar"}
          cancelText="Cancelar"
        />
      )}
    </>
  );
}
