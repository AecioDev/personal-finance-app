"use client";

import React, { useState } from "react";
import { FinancialEntry } from "@/interfaces/financial-entry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/components/providers/finance-provider";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";

interface FinancialEntryDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FinancialEntry | null;
  onPayNow: (entry: FinancialEntry) => void;
}

const DetailRow = ({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => (
  <div className="flex justify-between py-2 border-b border-border/50">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-medium text-right", valueClassName)}>
      {value}
    </span>
  </div>
);

export function FinancialEntryDetailsModal({
  isOpen,
  onOpenChange,
  entry,
  onPayNow,
}: FinancialEntryDetailsModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    accounts,
    paymentMethods,
    categories,
    revertFinancialEntryPayment,
    deleteFinancialEntry,
  } = useFinance();

  const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!entry) return null;

  const {
    status,
    description,
    expectedAmount,
    paidAmount,
    dueDate,
    paymentDate,
    accountId,
    paymentMethodId,
    categoryId,
  } = entry;

  const dueDateObj = new Date(dueDate);
  const isPaid = status === "paid";
  const isOverdue = !isPaid && isPast(dueDateObj) && !isToday(dueDateObj);

  const account = accountId ? accounts.find((a) => a.id === accountId) : null;
  const paymentMethod = paymentMethodId
    ? paymentMethods.find((p) => p.id === paymentMethodId)
    : null;
  const category = categoryId
    ? categories.find((c) => c.id === categoryId)
    : null;

  const daysOverdue = isOverdue ? differenceInDays(new Date(), dueDateObj) : 0;

  const handlePayClick = () => {
    onOpenChange(false);
    setTimeout(() => onPayNow(entry), 150);
  };

  const handleEdit = () => {
    const idToEdit = entry.recurrenceId || entry.id;
    router.push(`/financial-entry/${idToEdit}/edit`);
    onOpenChange(false);
  };

  const handleRevertPaymentClick = () => {
    setIsRevertConfirmOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!entry) return;
    try {
      await revertFinancialEntryPayment(entry);
      toast({
        title: "Sucesso!",
        description: "O pagamento foi estornado.",
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível estornar o pagamento: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsRevertConfirmOpen(false); // Fecha o dialog de confirmação
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entry) return;
    try {
      await deleteFinancialEntry(entry.id, "one"); // Assumindo que o delete aceita o escopo
      toast({ title: "Sucesso!", description: "Lançamento excluído." });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível excluir: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const getStatusText = () => {
    if (isPaid) return "Pago";
    if (isOverdue) return "Vencido";
    return "Pendente";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{description}</DialogTitle>
            <DialogDescription>
              Resumo dos valores e status deste lançamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm py-4">
            <DetailRow
              label="Status"
              value={getStatusText()}
              valueClassName={cn(
                isPaid
                  ? "text-green-500"
                  : isOverdue
                  ? "text-destructive"
                  : "text-foreground"
              )}
            />
            <DetailRow
              label="Vencimento"
              value={format(dueDateObj, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            />
            <DetailRow
              label="Valor Previsto"
              value={expectedAmount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />

            {isPaid && (
              <>
                <DetailRow
                  label="Valor Pago"
                  value={(paidAmount || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  valueClassName="text-green-500"
                />
                {paymentDate && (
                  <DetailRow
                    label="Data Pagamento"
                    value={format(new Date(paymentDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  />
                )}
                {account && <DetailRow label="Conta" value={account.name} />}
                {paymentMethod && (
                  <DetailRow label="Forma de Pag." value={paymentMethod.name} />
                )}
              </>
            )}
            {category && <DetailRow label="Categoria" value={category.name} />}
          </div>

          {isOverdue && daysOverdue > 0 && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive">
              <Icon
                icon="mdi:alert-circle-outline"
                className="h-10 w-10 flex-shrink-0"
              />
              <div className="text-sm">
                <p className="font-bold">
                  Esta despesa está atrasada há {daysOverdue}{" "}
                  {daysOverdue === 1 ? "dia" : "dias"}.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-between gap-2 pt-4 border-t">
            {!isPaid ? (
              // Se o lançamento está ABERTO
              <>
                {/* Botão Excluir: No mobile, será a segunda ordem. No PC, a primeira. */}
                <Button
                  variant="destructive-outline"
                  onClick={handleDeleteClick}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  <Icon icon="fa6-solid:trash-can" className="mr-2 h-4 w-4" />
                  Excluir
                </Button>

                {/* Grupo de Ações Primárias: No mobile, será a primeira ordem. No PC, a segunda. */}
                <div className="flex w-full sm:w-auto gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                    onClick={handleEdit}
                  >
                    <Icon icon="mdi:pencil" className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    className="flex-1 sm:flex-initial bg-accent text-accent-foreground"
                    onClick={handlePayClick}
                  >
                    <Icon
                      icon="fa6-solid:dollar-sign"
                      className="mr-2 h-4 w-4"
                    />
                    Pagar
                  </Button>
                </div>
              </>
            ) : (
              // Se o lançamento está PAGO
              // Botão Estornar fica na direita em telas de PC
              <Button
                variant="destructive-outline"
                className="w-full sm:w-auto sm:ml-auto"
                onClick={handleRevertPaymentClick}
              >
                <Icon icon="mdi:cash-refund" className="mr-2 h-4 w-4" />
                Estornar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO PARA O ESTORNO */}
      <ConfirmationDialog
        isOpen={isRevertConfirmOpen}
        onOpenChange={setIsRevertConfirmOpen}
        title="Estornar Pagamento?"
        description="Esta ação irá reabrir o lançamento e ajustar o saldo da conta associada. Tem certeza?"
        onConfirm={handleConfirmRevert}
        variant="destructive"
        confirmText="Sim, estornar"
      />

      {/* DIALOG DE CONFIRMAÇÃO PARA EXCLUSÃO */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={`Excluir "${entry.description}"?`}
        description="Esta ação não pode ser desfeita. O lançamento será removido permanentemente."
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="Sim, excluir"
      />
    </>
  );
}
