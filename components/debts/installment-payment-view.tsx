"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useFinance } from "@/components/providers/finance-provider";
import {
  PartialPaymentFormData,
  partialPaymentSchema,
} from "@/schemas/partial-payment-schema";
import { getDDMMYYYY } from "@/lib/dates";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { InstallmentPaymentForm } from "./installment-payment-form";

export function InstallmentPaymentView() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const {
    debts,
    debtInstallments,
    paymentMethods,
    accounts,
    processInstallmentPayment,
    loadingFinanceData,
  } = useFinance();

  const installmentId = params.installmentId as string;

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

  const formMethods = useForm<PartialPaymentFormData>({
    resolver: zodResolver(partialPaymentSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date(),
      paymentMethodId: "",
      accountId: "",
      interestPaid: 0,
      discountReceived: 0,
    },
  });

  const {
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = formMethods;
  const amountPaid = watch("amount");

  useEffect(() => {
    if (installment) {
      const dueAmount =
        installment.currentDueAmount || installment.expectedAmount;
      reset({
        paymentDate: new Date(),
        amount: dueAmount,
        paymentMethodId: paymentMethods[0]?.id || "",
        accountId: accounts[0]?.id || "",
        interestPaid: 0,
        discountReceived: 0,
      });
    }
  }, [installment, reset, accounts, paymentMethods]);

  useEffect(() => {
    if (!installment || amountPaid === null || isNaN(amountPaid)) return;
    const originalAmount = installment.expectedAmount;
    if (amountPaid > originalAmount) {
      setValue("interestPaid", amountPaid - originalAmount);
      setDiscountSuggestion(null);
    } else if (amountPaid < originalAmount && amountPaid > 0) {
      setDiscountSuggestion(originalAmount - amountPaid);
      setValue("interestPaid", 0);
    } else {
      setValue("interestPaid", 0);
      setDiscountSuggestion(null);
    }
  }, [amountPaid, installment, setValue]);

  const handleApplyDiscount = () => {
    if (discountSuggestion === null) return;
    setValue("discountReceived", discountSuggestion);
    setDiscountSuggestion(null);
    toast({ title: "Desconto aplicado!" });
  };

  const handlePaymentSubmit = async (data: PartialPaymentFormData) => {
    if (!installment) return;
    await processInstallmentPayment(installment.id, {
      amount: data.amount,
      accountId: data.accountId,
      paymentMethodId: data.paymentMethodId,
      date: data.paymentDate,
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

  const hasUpdatedAmount =
    installment.currentDueAmount &&
    installment.currentDueAmount > installment.expectedAmount;

  return (
    <FormProvider {...formMethods}>
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
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Previsto</p>
              <p className="font-bold text-lg">
                R$ {(installment.expectedAmount || 0).toFixed(2)}
              </p>
            </div>
            {hasUpdatedAmount && (
              <div>
                <p className="text-sm text-muted-foreground">Atualizado</p>
                <p className="font-bold text-lg text-amber-500">
                  R$ {(installment.currentDueAmount || 0).toFixed(2)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Realizado</p>
              <p className="font-bold text-lg text-green-500">
                R$ {(installment.paidAmount || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Falta</p>
              <p
                className={cn(
                  "font-bold text-lg",
                  installment.remainingAmount > 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                )}
              >
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
          <CardContent>
            <InstallmentPaymentForm
              onSubmit={handlePaymentSubmit}
              installment={installment}
              accounts={accounts}
              paymentMethods={paymentMethods}
              discountSuggestion={discountSuggestion}
              handleApplyDiscount={handleApplyDiscount}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
