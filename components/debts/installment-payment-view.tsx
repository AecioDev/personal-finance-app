"use client";

import React, { useEffect, useMemo } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { InstallmentPaymentForm } from "./installment-payment-form";
import { PageViewLayout } from "../layout/page-view-layout";

export function InstallmentPaymentView() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const {
    debts,
    debtInstallments,
    processInstallmentPayment,
    loadingFinanceData,
  } = useFinance();

  const installmentId = params.installmentId as string;

  const installment = useMemo(
    () => debtInstallments.find((inst) => inst.id === installmentId),
    [debtInstallments, installmentId]
  );
  const debt = useMemo(
    () => (installment ? debts.find((d) => d.id === installment.debtId) : null),
    [debts, installment]
  );

  // O FormProvider continua aqui para que o InstallmentPaymentForm funcione
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

  const { reset } = formMethods;

  useEffect(() => {
    if (installment) {
      const dueAmount =
        installment.remainingAmount ?? installment.expectedAmount;
      reset({
        amount: dueAmount,
        paymentDate: new Date(),
      });
    }
  }, [installment, reset]);

  const handlePaymentSubmit = async (data: PartialPaymentFormData) => {
    if (!installment) return;
    const success = await processInstallmentPayment(installment.id, {
      amount: data.amount,
      accountId: data.accountId,
      paymentMethodId: data.paymentMethodId,
      date: data.paymentDate,
      interestPaid: data.interestPaid,
      discountReceived: data.discountReceived,
    });
    if (success) {
      toast({
        title: "Sucesso!",
        description: "Pagamento registrado.",
      });
      router.back();
    }
  };

  if (loadingFinanceData)
    return (
      <PageViewLayout title="Registrar Pagamento">
        <div className="p-4 text-center">Carregando...</div>
      </PageViewLayout>
    );
  if (!installment || !debt)
    return (
      <PageViewLayout title="Erro">
        <div className="p-4 text-center">Dados da parcela não encontrados.</div>
      </PageViewLayout>
    );

  return (
    <PageViewLayout title="Registrar Pagamento">
      <FormProvider {...formMethods}>
        <div className="space-y-6">
          {/* Card de Resumo Refatorado */}
          <Card className="rounded-[2rem] shadow-md bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>{debt.description}</CardTitle>
              <CardDescription>
                Resumo da Parcela #{installment.installmentNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center font-medium">
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="font-bold text-lg font-numeric">
                  {getDDMMYYYY(installment.expectedDueDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor a Pagar</p>
                <p
                  className={cn(
                    "font-bold text-lg font-numeric",
                    (installment.remainingAmount ?? 0) > 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {(
                    installment.remainingAmount ?? installment.expectedAmount
                  ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Já Pago</p>
                <p className="font-bold text-lg font-numeric text-accent">
                  {(installment.paidAmount || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card do Formulário */}
          <Card className="rounded-[2rem] shadow-md">
            <CardHeader>
              <CardTitle>Dados do Pagamento</CardTitle>
              <CardDescription>
                Preencha as informações para registrar o pagamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstallmentPaymentForm
                onSubmit={handlePaymentSubmit}
                installment={installment}
              />
            </CardContent>
          </Card>
        </div>
      </FormProvider>
    </PageViewLayout>
  );
}
