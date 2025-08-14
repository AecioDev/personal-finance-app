"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useFinance } from "@/components/providers/finance-provider";
import { Debt, DebtInstallment, Transaction } from "@/interfaces/finance";
import {
  PartialPaymentFormData,
  partialPaymentSchema,
} from "@/schemas/partial-payment-schema";
import {
  toDateInputValue,
  parseDateFromInputValue,
  getDDMMYYYY,
} from "@/lib/dates";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { Icon } from "@iconify/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function InstallmentPaymentView() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const {
    debts,
    debtInstallments,
    transactions,
    paymentMethods,
    accounts,
    processInstallmentPayment,
    loadingFinanceData,
  } = useFinance();

  const installmentId = params.installmentId as string;

  // GÊ: State para controlar a sugestão de desconto
  const [discountSuggestion, setDiscountSuggestion] = useState<number | null>(
    null
  );

  const installment = useMemo(
    () => debtInstallments.find((inst) => inst.id === installmentId),
    [debtInstallments, installmentId]
  );
  const debt = useMemo(
    () => (installment ? debts.find((d) => d.id === installment.debtId) : null),
    [debts, installment]
  );
  const pastPayments = useMemo(
    () =>
      !installment?.transactionIds
        ? []
        : transactions.filter((t) => installment.transactionIds.includes(t.id)),
    [transactions, installment]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartialPaymentFormData>({
    resolver: zodResolver(partialPaymentSchema),
    defaultValues: {
      amount: 0,
      paymentDate: toDateInputValue(new Date()),
      paymentMethodId: "",
      accountId: "",
      interestPaid: null,
      discountReceived: null,
    },
  });

  const amountPaid = watch("amount");

  useEffect(() => {
    if (installment) {
      //const remaining = installment.remainingAmount ?? installment.expectedAmount;
      const remaining = installment.expectedAmount;

      reset({
        paymentDate: toDateInputValue(new Date()),
        amount: 0,
        paymentMethodId: "",
        accountId: accounts.length > 0 ? accounts[0].id : "",
        interestPaid: null,
        discountReceived: null,
      });
    }
  }, [installment, reset, accounts]);

  useEffect(() => {
    if (!installment || amountPaid === null || isNaN(amountPaid)) return;

    //const remaining = installment.remainingAmount ?? installment.expectedAmount;
    const remaining = installment.expectedAmount;

    // Lógica de Juros (automática)
    if (amountPaid > remaining) {
      const interest = amountPaid - remaining;
      setValue("interestPaid", interest);
      setDiscountSuggestion(null); // Limpa sugestão de desconto
    }
    // Lógica de Desconto (sugestão)
    else if (amountPaid < remaining && amountPaid > 0) {
      const difference = remaining - amountPaid;
      setDiscountSuggestion(difference);
      setValue("interestPaid", null); // Garante que juros seja nulo
    }
    // Caso o valor seja igual ou zero, limpa tudo
    else {
      setValue("interestPaid", null);
      setDiscountSuggestion(null);
    }
  }, [amountPaid, installment, setValue]);

  const handleApplyDiscount = () => {
    if (discountSuggestion === null) return;
    setValue("discountReceived", discountSuggestion);
    setDiscountSuggestion(null);
    toast({
      title: "Desconto aplicado!",
      description: "O valor restante será quitado como desconto.",
    });
  };

  const handlePaymentSubmit = async (data: PartialPaymentFormData) => {
    if (!installment) return;
    await processInstallmentPayment(installment.id, {
      amount: data.amount,
      accountId: data.accountId,
      paymentMethodId: data.paymentMethodId,
      date: parseDateFromInputValue(data.paymentDate),
      interestPaid: data.interestPaid,
      discountReceived: data.discountReceived,
    });
    toast({
      title: "Sucesso!",
      description: "Pagamento registrado.",
      variant: "success",
    });
    router.back();
  };

  if (loadingFinanceData)
    return <div className="p-4 text-center">Carregando...</div>;
  if (!installment || !debt)
    return (
      <div className="p-4 text-center">Dados da parcela não encontrados.</div>
    );

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <div className="flex items-center gap-4">
        <ButtonBack onClick={() => router.back()} />
        <h1 className="text-2xl font-bold truncate">{debt.description}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Resumo da Parcela #{installment.installmentNumber}
          </CardTitle>
          <CardDescription>
            Vencimento em: {getDDMMYYYY(installment.expectedDueDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Previsto</p>
            <p className="font-bold text-lg">
              R$ {(installment.expectedAmount || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Realizado</p>
            <p className="font-bold text-lg text-green-500">
              R$ {(installment.paidAmount || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Falta</p>
            <p className="font-bold text-lg text-red-500">
              R${" "}
              {(
                installment.remainingAmount ?? installment.expectedAmount
              ).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Novo Pagamento</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(handlePaymentSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Pago</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm">{errors.amount.message}</p>
              )}
            </div>

            {/* GÊ: O ALERTA INTELIGENTE PARA DESCONTO */}
            {discountSuggestion !== null && (
              <Alert>
                <Icon icon="mdi:lightbulb-on-outline" className="h-4 w-4" />
                <AlertTitle>Dica do Assistente</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>
                    A diferença de R$ {discountSuggestion.toFixed(2)} pode
                    quitar a parcela.
                  </span>
                  <Button type="button" size="sm" onClick={handleApplyDiscount}>
                    Aplicar como Desconto
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interestPaid">Juros / Multa</Label>
                <Input
                  id="interestPaid"
                  type="number"
                  step="0.01"
                  {...register("interestPaid", { valueAsNumber: true })}
                  placeholder="0,00"
                  readOnly={amountPaid > (installment.remainingAmount ?? 0)}
                />
                {errors.interestPaid && (
                  <p className="text-red-500 text-sm">
                    {errors.interestPaid.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountReceived">Desconto</Label>
                <Input
                  id="discountReceived"
                  type="number"
                  step="0.01"
                  {...register("discountReceived", { valueAsNumber: true })}
                  placeholder="0,00"
                />
                {errors.discountReceived && (
                  <p className="text-red-500 text-sm">
                    {errors.discountReceived.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data do Pagamento</Label>
              <Input
                id="paymentDate"
                type="date"
                {...register("paymentDate")}
              />
              {errors.paymentDate && (
                <p className="text-red-500 text-sm">
                  {errors.paymentDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountId">Conta Utilizada</Label>
              <Select
                onValueChange={(value) =>
                  setValue("accountId", value, { shouldValidate: true })
                }
                value={watch("accountId") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-red-500 text-sm">
                  {errors.accountId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Forma de Pagamento</Label>
              <Select
                onValueChange={(value) =>
                  setValue("paymentMethodId", value, { shouldValidate: true })
                }
                value={watch("paymentMethodId") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethodId && (
                <p className="text-red-500 text-sm">
                  {errors.paymentMethodId.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Icon icon="mdi:cash-check" className="mr-2 h-4 w-4" />
              {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
