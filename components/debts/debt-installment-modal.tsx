"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DebtInstallment } from "@/interfaces/finance";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { DebtInstallmentFormContent } from "./debt-installment-form-content"; // Assumindo que este componente existe e é um formulário
import { ConfirmationDialog } from "../common/confirmation-dialog";
import { getDDMMYYYY } from "@/lib/dates";

interface DebtInstallmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingInstallment: DebtInstallment | null;
}

export function DebtInstallmentModal({
  isOpen,
  onOpenChange,
  editingInstallment,
}: DebtInstallmentModalProps) {
  const router = useRouter();
  const {
    revertInstallmentPayment,
    updateDebtInstallment,
    loadingFinanceData,
  } = useFinance();
  const { toast } = useToast();

  const [isConfirmingRevert, setIsConfirmingRevert] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // Determina o modo do modal baseado no status da parcela
  const isPaidOrPartial =
    editingInstallment?.status === "paid" ||
    editingInstallment?.status === "partial";

  // Função para estornar e redirecionar (para parcelas pagas/parciais)
  const handleRevertAndRedirect = async () => {
    if (!editingInstallment) return;

    setIsReverting(true);
    try {
      await revertInstallmentPayment(editingInstallment.id);
      toast({
        title: "Pronto para Edição!",
        description: "Pagamentos estornados. Redirecionando...",
        variant: "success",
      });
      // router.push(
      //   `/debts/${editingInstallment.debtId}/installments/${editingInstallment.id}`
      // );
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

  // Função para salvar alterações da parcela (para parcelas pendentes)
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
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar parcela:", error);
      // O form-content deve exibir o toast de erro
      throw error;
    }
  };

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

          {/* Renderização Condicional do Conteúdo */}
          {isPaidOrPartial ? (
            // MODO 1: Visualização e Estorno
            /* Corpo com os detalhes da parcela (somente visualização) */
            editingInstallment && (
              <div className="space-y-4 py-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">
                    {editingInstallment.status}
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
                        <span className="text-muted-foreground">
                          Juros Pagos
                        </span>
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
              </div>
            )
          ) : (
            // MODO 2: Edição Direta no Formulário
            <DebtInstallmentFormContent
              editingInstallment={editingInstallment}
              onSave={handleSaveInstallment}
              loading={loadingFinanceData}
              onClose={() => onOpenChange(false)}
            />
          )}

          <DialogFooter>
            {isPaidOrPartial ? (
              // Botões para o MODO 1
              <>
                <Button
                  className="my-2"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
                <Button
                  className="my-2"
                  onClick={() => setIsConfirmingRevert(true)}
                  disabled={loadingFinanceData || isReverting}
                >
                  Habilitar Edição
                </Button>
              </>
            ) : // Botões para o MODO 2 (são controlados pelo form-content)
            // O botão de salvar e cancelar já devem estar dentro do DebtInstallmentFormContent
            null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* O modal de confirmação só é relevante para o fluxo de estorno */}
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
