"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Transaction, TransactionType } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useFinance } from "@/components/providers/finance-provider";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns"; // Importa format e parse

// --- Schema de Validação com Zod para Transações ---
const transactionFormSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória."),
  amount: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().positive("O valor deve ser um número positivo.")
  ),
  date: z.string().min(1, "A data é obrigatória."),
  type: z.enum(["income", "expense"], {
    message: "O tipo de transação é obrigatório.",
  }),
  accountId: z.string().min(1, "A conta é obrigatória."),
  category: z.string().min(1, "A categoria é obrigatória."),
  paymentMethodId: z.string().optional().nullable(),
  debtInstallmentId: z.string().optional().nullable(),
  isLoanIncome: z.boolean().optional(),
  loanSource: z.string().optional().nullable(),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

export function TransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    accounts,
    paymentMethods,
    debtInstallments,
    debts,
    addTransaction,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();

  const [isFormPrefilled, setIsFormPrefilled] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"), // Garante que a data padrão seja local
      type: "expense",
      accountId: "",
      category: "",
      paymentMethodId: null,
      debtInstallmentId: null,
      isLoanIncome: false,
      loanSource: null,
    },
  });

  const transactionType = watch("type");
  const debtInstallmentId = searchParams.get("installmentId");
  const transactionFormType =
    (searchParams.get("type") as TransactionType) || "expense";

  useEffect(() => {
    if (isFormPrefilled) {
      return;
    }

    if (debtInstallmentId && debtInstallments.length > 0 && debts.length > 0) {
      const installment = debtInstallments.find(
        (inst) => inst.id === debtInstallmentId
      );
      if (installment) {
        const debt = debts.find((d) => d.id === installment.debtId);
        if (debt) {
          reset({
            description: `Pagamento Parcela ${
              installment.installmentNumber || ""
            } - ${debt.description}`,
            amount: installment.expectedAmount ?? 0,
            date: format(new Date(), "yyyy-MM-dd"), // Garante que a data de pré-preenchimento seja local
            type: "expense",
            accountId: accounts.length > 0 ? accounts[0].id : "",
            category: "pagamento_divida",
            debtInstallmentId: installment.id,
            paymentMethodId: null,
            isLoanIncome: false,
            loanSource: null,
          });
          toast({
            title: "Pagamento de Dívida",
            description: `Formulário pré-preenchido para a parcela ${
              installment.installmentNumber || ""
            } de ${debt.description}.`,
            variant: "default",
          });
          setIsFormPrefilled(true);
        }
      }
    } else if (transactionFormType) {
      if (watch("type") !== transactionFormType) {
        setValue("type", transactionFormType);
        setIsFormPrefilled(true);
      }
    }
  }, [
    debtInstallmentId,
    debtInstallments,
    debts,
    accounts,
    reset,
    toast,
    transactionFormType,
    setValue,
    isFormPrefilled,
    watch,
  ]);

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  const onSubmit = async (data: TransactionFormData) => {
    if (loadingFinanceData) {
      toast({
        title: "Aguarde",
        description:
          "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
        variant: "default",
      });
      return;
    }

    const transactionToSave: Omit<Transaction, "id" | "uid" | "createdAt"> = {
      description: data.description,
      amount: data.amount,
      date: data.date,
      type: data.type,
      accountId: data.accountId,
      category: data.category,
      paymentMethodId: data.paymentMethodId ?? null,
      debtInstallmentId: data.debtInstallmentId ?? null,
      isLoanIncome: data.isLoanIncome || false,
      loanSource: data.isLoanIncome ? data.loanSource ?? null : null,
    };

    try {
      await addTransaction(transactionToSave);
      toast({
        title: "Sucesso",
        description: "Lançamento salvo com sucesso!",
        variant: "success",
      });
      router.back();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o lançamento.",
        variant: "destructive",
      });
      console.error("Erro ao salvar lançamento:", error);
    }
  };

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando dados financeiros...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <ButtonBack onClick={() => router.back()} />
        <h1 className="text-2xl font-bold">Novo Lançamento</h1>
        <div className="w-10 h-10"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Lançamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Ex: Salário, Aluguel, Parcela do Carro"
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={transactionType}
                onValueChange={(value: TransactionType) =>
                  setValue("type", value)
                }
                disabled={isSubmitting || loadingFinanceData}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">Conta</Label>
              <Select
                value={watch("accountId")}
                onValueChange={(value: string) => setValue("accountId", value)}
                disabled={
                  isSubmitting || loadingFinanceData || accounts.length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">
                      Nenhuma conta cadastrada.
                    </p>
                  ) : (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-red-500 text-sm">
                  {errors.accountId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                {...register("category")}
                placeholder="Ex: Salário, Aluguel, Transporte"
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.category && (
                <p className="text-red-500 text-sm">
                  {errors.category.message}
                </p>
              )}
            </div>

            {transactionType === "expense" && (
              <div className="space-y-2">
                <Label htmlFor="paymentMethodId">
                  Forma de Pagamento (Opcional)
                </Label>
                <Select
                  value={watch("paymentMethodId") || "null-option"}
                  onValueChange={(value: string) =>
                    setValue(
                      "paymentMethodId",
                      value === "null-option" ? null : value
                    )
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
                    <SelectItem value="null-option">Nenhum</SelectItem>
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
                {errors.paymentMethodId && (
                  <p className="text-red-500 text-sm">
                    {errors.paymentMethodId.message}
                  </p>
                )}
              </div>
            )}

            {transactionType === "income" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLoanIncome"
                  checked={watch("isLoanIncome") || false}
                  onCheckedChange={(checked) =>
                    setValue("isLoanIncome", checked as boolean)
                  }
                  disabled={isSubmitting || loadingFinanceData}
                />
                <Label htmlFor="isLoanIncome">Receita de Empréstimo?</Label>
              </div>
            )}

            {watch("isLoanIncome") && transactionType === "income" && (
              <div className="space-y-2">
                <Label htmlFor="loanSource">Origem do Empréstimo</Label>
                <Input
                  id="loanSource"
                  {...register("loanSource")}
                  placeholder="Ex: Banco X, Amigo Y"
                  disabled={isSubmitting || loadingFinanceData}
                />
                {errors.loanSource && (
                  <p className="text-red-500 text-sm">
                    {errors.loanSource.message}
                  </p>
                )}
              </div>
            )}

            <input type="hidden" {...register("debtInstallmentId")} />

            <Button type="submit" disabled={isSubmitting || loadingFinanceData}>
              {isSubmitting ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
