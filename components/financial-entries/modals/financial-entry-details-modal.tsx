"use client";

import React, { useState } from "react"; // 1. Importa o useState
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
import { EditFinancialEntryModal } from "./edit-financial-entry-modal";

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
  const { toast } = useToast();
  const { accounts, paymentMethods, categories } = useFinance();

  // 3. Estado para controlar o modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  // 4. A função de editar agora abre o nosso novo modal
  const handleEdit = () => {
    onOpenChange(false); // Fecha o modal de detalhes
    setTimeout(() => setIsEditModalOpen(true), 150); // Abre o modal de edição
  };

  const handleRevertPayment = () => {
    toast({
      title: "Em breve!",
      description: "O estorno de pagamentos será implementado.",
    });
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

          <DialogFooter className="mt-4 gap-2 grid grid-cols-2 sm:flex sm:justify-end">
            {!isPaid ? (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <Icon icon="mdi:pencil" className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  className="bg-accent text-accent-foreground"
                  onClick={handlePayClick}
                >
                  <Icon icon="fa6-solid:dollar-sign" className="mr-2 h-4 w-4" />
                  Pagar
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={handleRevertPayment}>
                <Icon icon="mdi:cash-refund" className="mr-2 h-4 w-4" />
                Estornar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Renderiza o modal de edição, passando os dados necessários */}
      <EditFinancialEntryModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        entryToEdit={entry}
      />
    </>
  );
}
