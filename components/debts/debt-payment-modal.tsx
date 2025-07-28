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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { isBefore } from "date-fns";
import { Icon } from "@iconify/react";
import { PaymentMethodsFormModal } from "@/components/payment-methods/payment-methods-form-modal";
// GÊ: Importando nossas novas e confiáveis funções de data!
import {
  getDDMMYYYY,
  toDateInputValue,
  parseDateFromInputValue,
} from "@/lib/dates";

interface DebtPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  installmentToPayId: string | null;
}

// GÊ: Criei um tipo para a variante do alerta para ficar mais claro.
type FeedbackVariant = "default" | "destructive";

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
  } = useFinance();

  const [currentInstallment, setCurrentInstallment] =
    useState<DebtInstallment | null>(null);
  const [parentDebt, setParentDebt] = useState<Debt | null>(null);
  const [paymentFeedbackMessage, setPaymentFeedbackMessage] = useState<
    string | null
  >(null);
  // GÊ: O estado da variante agora usa nosso novo tipo.
  const [paymentFeedbackVariant, setPaymentFeedbackVariant] =
    useState<FeedbackVariant>("default");
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
  });

  const actualPaidAmount = watch("actualPaidAmount");
  const paymentDate = watch("paymentDate");
  const selectedPaymentMethodId = watch("paymentMethodId");

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

        reset({
          actualPaidAmount: installment.expectedAmount,
          // GÊ: Usando a função toDateInputValue para garantir o formato YYYY-MM-DD correto.
          paymentDate: toDateInputValue(new Date()),
          paymentMethodId: "",
        });
      }
    }
  }, [isOpen, installmentToPayId, debtInstallments, debts, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setCurrentInstallment(null);
      setParentDebt(null);
      setPaymentFeedbackMessage(null);
    }
  }, [isOpen, reset]);

  // GÊ: Função de feedback refatorada para usar as novas funções de data
  const calculatePaymentFeedback = () => {
    if (!currentInstallment || !actualPaidAmount || !paymentDate) {
      setPaymentFeedbackMessage(null);
      return;
    }

    const expectedAmount = currentInstallment.expectedAmount;
    const paidAmount = Number(actualPaidAmount);
    // GÊ: Convertendo a string do input para um objeto Date seguro para comparação.
    const paidDateObj = parseDateFromInputValue(paymentDate);
    const dueDateObj = currentInstallment.expectedDueDate; // Já é um objeto Date

    if (paidAmount > expectedAmount) {
      const difference = paidAmount - expectedAmount;
      setPaymentFeedbackMessage(
        `Você pagou R$ ${difference.toFixed(
          2
        )} a mais. Isso provavelmente inclui juros ou multas. Tente pagar em dia da próxima vez!`
      );
      setPaymentFeedbackVariant("destructive");
    } else if (
      paidAmount < expectedAmount &&
      isBefore(paidDateObj, dueDateObj)
    ) {
      const difference = expectedAmount - paidAmount;
      setPaymentFeedbackMessage(
        `Excelente! Você pagou R$ ${difference.toFixed(
          2
        )} a menos, provavelmente por um desconto de antecipação. Continue assim!`
      );
      setPaymentFeedbackVariant("default"); // Usando a variante default para sucesso
    } else if (
      paidAmount === expectedAmount &&
      isBefore(paidDateObj, dueDateObj)
    ) {
      setPaymentFeedbackMessage(
        "Ótimo trabalho pagando em dia! Manter essa disciplina é a chave para a saúde financeira."
      );
      setPaymentFeedbackVariant("default");
    } else {
      setPaymentFeedbackMessage(null);
    }
  };

  // GÊ: Dispara o cálculo do feedback quando os valores relevantes mudam.
  useEffect(() => {
    calculatePaymentFeedback();
  }, [actualPaidAmount, paymentDate, currentInstallment]);

  const onSubmit = async (data: DebtPaymentFormData) => {
    if (!currentInstallment || !parentDebt || !data.paymentMethodId) {
      toast({
        title: "Erro",
        description: "Dados incompletos.",
        variant: "destructive",
      });
      return;
    }

    const selectedPaymentMethod = paymentMethods.find(
      (pm) => pm.id === data.paymentMethodId
    );
    if (!selectedPaymentMethod) return;

    const accountIdToUse =
      selectedPaymentMethod.defaultAccountId || accounts[0]?.id;
    if (!accountIdToUse) {
      toast({
        title: "Erro",
        description: "Nenhuma conta associada.",
        variant: "destructive",
      });
      return;
    }

    const transactionToSave: Omit<Transaction, "id" | "uid" | "createdAt"> = {
      description: `Pagamento: ${parentDebt.description} #${
        currentInstallment.installmentNumber || ""
      }`,
      amount: data.actualPaidAmount ?? 0,
      date: parseDateFromInputValue(data.paymentDate),
      type: "expense",
      accountId: accountIdToUse,
      category: "Pagamento de Dívida",
      paymentMethodId: data.paymentMethodId,
      debtInstallmentId: currentInstallment.id,
      isLoanIncome: false,
      loanSource: "",
    };

    console.log("Dados Pagamento: ", transactionToSave);

    // try {
    //   await addTransaction(transactionToSave);
    //   toast({
    //     title: "Sucesso!",
    //     description: "Pagamento registrado.",
    //     variant: "success",
    //   });
    //   onOpenChange(false);
    // } catch (error) {
    //   toast({
    //     title: "Erro",
    //     description: "Falha ao registrar pagamento.",
    //     variant: "destructive",
    //   });
    //   console.error("Erro ao registrar pagamento:", error);
    // }
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
              ? `Parcela de R$ ${currentInstallment.expectedAmount.toFixed(
                  2
                )} com vencimento em ${getDDMMYYYY(
                  currentInstallment.expectedDueDate
                )}.`
              : "Preencha os detalhes do pagamento."}
          </DialogDescription>
        </DialogHeader>

        {/* GÊ: A GRANDE MUDANÇA! Usando o componente Alert para o feedback. */}
        {paymentFeedbackMessage && (
          <Alert variant={paymentFeedbackVariant} className="mt-4">
            <Icon icon="mdi:robot-happy-outline" className="h-5 w-5" />
            <AlertTitle>Dica do Assistente</AlertTitle>
            <AlertDescription>{paymentFeedbackMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data do Pagamento</Label>
            <Input
              id="paymentDate"
              type="date"
              {...register("paymentDate")}
              disabled={isSubmitting}
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
              {...register("actualPaidAmount", { valueAsNumber: true })}
              placeholder="0,00"
              disabled={isSubmitting}
            />
            {errors.actualPaidAmount && (
              <p className="text-red-500 text-sm">
                {errors.actualPaidAmount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethodId">Forma de Pagamento</Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedPaymentMethodId || ""}
                onValueChange={(value) =>
                  setValue("paymentMethodId", value, { shouldValidate: true })
                }
                disabled={isSubmitting || paymentMethods.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPaymentMethodModalOpen(true)}
                  disabled={isSubmitting}
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
