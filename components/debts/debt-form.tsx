"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { useFinance } from "@/components/providers/finance-provider";
import { DebtFormData, debtSchema } from "@/schemas/debt-schema";
import { Debt } from "@/interfaces/finance";
import { DatePicker } from "../ui/date-picker";
import { CurrencyInput } from "../ui/currency-input";

interface DebtFormProps {
  debtId?: string;
}

export function DebtForm({ debtId }: DebtFormProps) {
  const router = useRouter();
  const { debts, addDebt, updateDebt, loadingFinanceData } = useFinance();
  const { toast } = useToast();

  const formMethods = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      description: "",
      originalAmount: 0,
      totalRepaymentAmount: 0,
      isRecurring: false,
      totalInstallments: 1,
      expectedInstallmentAmount: 0,
      startDate: new Date(),
      endDate: null,
    },
  });

  const {
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = formMethods;

  const isRecurring = watch("isRecurring");
  const totalInstallments = watch("totalInstallments");
  const expectedInstallmentAmount = watch("expectedInstallmentAmount");

  useEffect(() => {
    if (!isRecurring && totalInstallments && expectedInstallmentAmount) {
      setValue(
        "totalRepaymentAmount",
        totalInstallments * expectedInstallmentAmount
      );
    } else {
      setValue("totalRepaymentAmount", 0);
    }
  }, [totalInstallments, expectedInstallmentAmount, isRecurring, setValue]);

  useEffect(() => {
    if (debtId) {
      const existingDebt = debts.find((d) => d.id === debtId);
      if (existingDebt) {
        reset({
          ...existingDebt,
          startDate: new Date(existingDebt.startDate),
          endDate: existingDebt.endDate ? new Date(existingDebt.endDate) : null,
        } as DebtFormData);
      }
    }
  }, [debtId, debts, reset]);

  const onSubmit = async (data: DebtFormData) => {
    try {
      if (debtId) {
        const existingDebt = debts.find((d) => d.id === debtId);
        if (!existingDebt) throw new Error("Dívida não encontrada.");

        const totalPaid = existingDebt.totalPaidOnThisDebt || 0;
        const newOutstandingBalance =
          (data.totalRepaymentAmount || data.originalAmount) - totalPaid;

        await updateDebt(debtId, {
          ...data,
          currentOutstandingBalance: newOutstandingBalance,
        } as Partial<Debt>);
        toast({
          title: "Sucesso",
          description: "Dívida atualizada!",
        });
      } else {
        const debtDataForApi = {
          ...data,
          type: "complete",
        };
        await addDebt(debtDataForApi);
        toast({
          title: "Sucesso",
          description: "Dívida cadastrada!",
        });
      }
      router.push("/debts");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a dívida.",
        variant: "destructive",
      });
    }
  };

  return (
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <ButtonBack onClick={() => router.back()} />
          <h1 className="text-2xl font-bold text-center mx-4">
            {debtId ? "Editar Dívida" : "Nova Dívida"}
          </h1>
          <div className="w-10 h-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Dívida</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...formMethods}>
              <form
                onSubmit={formMethods.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={formMethods.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Financiamento do Carro"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="originalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Original</FormLabel>
                      <FormControl>
                        <CurrencyInput {...field} value={field.value || 0} />
                      </FormControl>
                      <FormDescription>
                        O valor que entrou na sua conta ou o valor total do bem.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Dívida Recorrente</FormLabel>
                    </FormItem>
                  )}
                />

                {!isRecurring && (
                  <div className="space-y-6 p-4 border rounded-md">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={formMethods.control}
                        name="totalInstallments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total de Parcelas</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formMethods.control}
                        name="expectedInstallmentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor da Parcela</FormLabel>
                            <FormControl>
                              <CurrencyInput
                                {...field}
                                value={field.value || 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={formMethods.control}
                      name="totalRepaymentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total a Pagar (calculado)</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              {...field}
                              value={field.value || 0}
                              readOnly
                              className="bg-muted/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={formMethods.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início / 1º Vencimento</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value || undefined}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formMethods.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término (Opcional)</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value || undefined}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || loadingFinanceData}
                >
                  {isSubmitting ? "Salvando..." : "Salvar Dívida"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
