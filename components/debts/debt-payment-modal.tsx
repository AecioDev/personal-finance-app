"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useFinance } from "@/components/providers/finance-provider";
import { Debt, DebtInstallment, Transaction } from "@/interfaces/finance";
import {
  debtPaymentSchema,
  DebtPaymentFormData,
} from "@/schemas/debt-payment-schema";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { DialogTrigger } from "@/components/ui/dialog";
import { PaymentMethodsFormModal } from "@/components/payment-methods/payment-methods-form-modal";

interface DebtPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  installmentToPayId: string | null;
}

export function DebtPaymentModal({
  isOpen,
  onOpenChange,
  installmentToPayId,
}: DebtPaymentModalProps) {
  const { toast } = useToast();
  const {
    debtInstallments,
    debts,
    paymentMethods,
    accounts,
    addTransaction,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();

  const [currentInstallment, setCurrentInstallment] =
    useState<DebtInstallment | null>(null);
  const [parentDebt, setParentDebt] = useState<Debt | null>(null);
  const [paymentFeedbackMessage, setPaymentFeedbackMessage] = useState<
    string | null
  >(null);
  const [paymentFeedbackVariant, setPaymentFeedbackVariant] = useState<
    "default" | "destructive" | "success" | null
  >(null);

  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] =
    useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DebtPaymentFormData>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: {
      actualPaidAmount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethodId: "",
    },
  });

  const actualPaidAmount = watch("actualPaidAmount");
  const paymentDate = watch("paymentDate");
  const selectedPaymentMethodId = watch("paymentMethodId");

  // Efeito para pré-preencher o formulário se for um pagamento de dívida
  useEffect(() => {
    if (
      isOpen &&
      installmentToPayId &&
      debtInstallments.length > 0 &&
      debts.length > 0
    ) {
      const installment = debtInstallments.find(
        (inst) => inst.id === installmentToPayId
      );
      if (installment) {
        setCurrentInstallment(installment);
        const debt = debts.find((d) => d.id === installment.debtId);
        setParentDebt(debt || null);

        // O valor pago inicial é vazio, não o valor esperado da parcela
        reset({
          actualPaidAmount: 0, // ALTERADO: Valor inicial vazio
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethodId: "",
        });
      } else {
        toast({
          title: "Erro",
          description: "Parcela da dívida não encontrada.",
          variant: "destructive",
        });
        onOpenChange(false);
      }
    }
  }, [
    isOpen,
    installmentToPayId,
    debtInstallments,
    debts,
    onOpenChange,
    reset,
    setValue,
  ]);

  // Efeito para resetar o formulário e estados quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      reset();
      setCurrentInstallment(null);
      setParentDebt(null);
      setPaymentFeedbackMessage(null);
      setPaymentFeedbackVariant(null);
    }
  }, [isOpen, reset]);

  // Função para calcular e definir a mensagem de feedback
  const calculatePaymentFeedback = () => {
    if (
      currentInstallment &&
      actualPaidAmount !== null &&
      actualPaidAmount !== 0 &&
      paymentDate
    ) {
      const expectedAmount = currentInstallment.expectedAmount || 0;
      const parsedActualPaidAmount = parseFloat(actualPaidAmount.toString());
      const dueDate = parseISO(currentInstallment.expectedDueDate);
      const paidDate = parseISO(paymentDate);

      if (parsedActualPaidAmount > expectedAmount) {
        const jurosMulta = parsedActualPaidAmount - expectedAmount;
        setPaymentFeedbackMessage(
          `Parece que você pagou R$ ${jurosMulta.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })} de juros/multa nesta parcela. Se esforce para não atrasar a próxima!`
        );
        setPaymentFeedbackVariant("destructive");
      } else if (
        parsedActualPaidAmount < expectedAmount &&
        isBefore(paidDate, dueDate)
      ) {
        const desconto = expectedAmount - parsedActualPaidAmount;
        setPaymentFeedbackMessage(
          `Você está indo bem! Pagando R$ ${desconto.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })} a menos e adiantado, você ganha desconto e paga menos juros!`
        );
        setPaymentFeedbackVariant("success");
      } else if (
        parsedActualPaidAmount === expectedAmount &&
        isBefore(paidDate, dueDate)
      ) {
        setPaymentFeedbackMessage(
          "Se você se esforçar mais para pagar adiantado, você pode ganhar um desconto ou evitar juros!"
        );
        setPaymentFeedbackVariant("default");
      } else {
        setPaymentFeedbackMessage(null);
        setPaymentFeedbackVariant(null);
      }
    } else {
      setPaymentFeedbackMessage(null);
      setPaymentFeedbackVariant(null);
    }
  };

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
      onOpenChange(false);
    }
  }, [errorFinanceData, toast, onOpenChange]);

  const onSubmit = async (data: DebtPaymentFormData) => {
    if (!currentInstallment || !parentDebt) {
      toast({
        title: "Erro",
        description: "Dados da parcela ou dívida ausentes.",
        variant: "destructive",
      });
      return;
    }

    if (loadingFinanceData) {
      toast({
        title: "Aguarde",
        description:
          "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
        variant: "default",
      });
      return;
    }

    const selectedPaymentMethod = paymentMethods.find(
      (pm) => pm.id === data.paymentMethodId
    );
    if (!selectedPaymentMethod) {
      toast({
        title: "Erro",
        description: "Forma de pagamento selecionada inválida.",
        variant: "destructive",
      });
      return;
    }

    const accountIdToUse =
      selectedPaymentMethod.defaultAccountId ||
      (accounts.length > 0 ? accounts[0].id : "");

    if (!accountIdToUse) {
      toast({
        title: "Erro",
        description:
          "Nenhuma conta vinculada à forma de pagamento ou contas cadastradas.",
        variant: "destructive",
      });
      return;
    }

    const transactionToSave: Omit<Transaction, "id" | "uid" | "createdAt"> = {
      description: `Pagamento de ${parentDebt.description} - Parcela ${
        currentInstallment.installmentNumber || ""
      }`,
      amount: data.actualPaidAmount ?? 0,
      date: data.paymentDate,
      type: "expense",
      accountId: accountIdToUse,
      category: "pagamento_divida",
      paymentMethodId: data.paymentMethodId,
      debtInstallmentId: currentInstallment.id,
      isLoanIncome: false,
      loanSource: null,
    };

    try {
      await addTransaction(transactionToSave);
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
      console.error("Erro ao registrar pagamento:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {parentDebt?.description || "Registrar Pagamento"}
          </DialogTitle>
          <DialogDescription>
            {currentInstallment
              ? `Parcela de R$ ${currentInstallment.expectedAmount?.toLocaleString(
                  "pt-BR",
                  { minimumFractionDigits: 2 }
                )} com vencimento em ${format(
                  new Date(currentInstallment.expectedDueDate),
                  "dd/MM/yyyy",
                  { locale: ptBR }
                )}.`
              : "Preencha os detalhes do pagamento da dívida."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data do Pagamento</Label>
            <Input
              id="paymentDate"
              type="date"
              {...register("paymentDate", { onBlur: calculatePaymentFeedback })}
              disabled={isSubmitting || loadingFinanceData}
            />
            {errors.paymentDate && (
              <p className="text-red-500 text-sm">
                {errors.paymentDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="actualPaidAmount">Valor Pago</Label>
            <Input
              id="actualPaidAmount"
              type="number"
              step="0.01"
              {...register("actualPaidAmount", {
                onBlur: calculatePaymentFeedback,
              })}
              placeholder="0.00"
              disabled={isSubmitting || loadingFinanceData}
            />
            {errors.actualPaidAmount && (
              <p className="text-red-500 text-sm">
                {errors.actualPaidAmount.message}
              </p>
            )}
          </div>

          {/* Mensagem de Feedback Dinâmica */}
          {paymentFeedbackMessage && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                paymentFeedbackVariant === "destructive"
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                  : paymentFeedbackVariant === "success"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              }`}
            >
              <Icon
                icon="mdi:robot-happy-outline"
                className="h-6 w-6 flex-shrink-0"
              />
              <p className="text-sm">{paymentFeedbackMessage}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentMethodId">Forma de Pagamento</Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedPaymentMethodId || ""}
                onValueChange={(value: string) =>
                  setValue("paymentMethodId", value)
                }
                disabled={
                  isSubmitting ||
                  loadingFinanceData ||
                  paymentMethods.length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">
                      Nenhuma forma de pagamento cadastrada.
                    </p>
                  ) : (
                    paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPaymentMethodModalOpen(true)}
                  disabled={isSubmitting || loadingFinanceData}
                >
                  <Icon icon="mdi:plus" className="h-5 w-5" />
                </Button>
              </DialogTrigger>
            </div>
            {errors.paymentMethodId && (
              <p className="text-red-500 text-sm">
                {errors.paymentMethodId.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || loadingFinanceData}>
              {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <PaymentMethodsFormModal
        isOpen={isPaymentMethodModalOpen}
        onOpenChange={setIsPaymentMethodModalOpen}
        loadingFinanceData={loadingFinanceData}
      />
    </Dialog>
  );
}
