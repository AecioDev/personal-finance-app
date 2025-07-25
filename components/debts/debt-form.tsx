"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Debt } from "@/interfaces/finance";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { useFinance } from "@/components/providers/finance-provider";
import { debtSchema, DebtFormData } from "@/schemas/debt-schema";
import { Icon } from "@iconify/react";
import { DialogTrigger } from "@/components/ui/dialog";
import { DebtTypeModal } from "@/components/debt-types/debt-type-modal";
import { format, parse } from "date-fns"; // Importa parse e format

interface DebtFormProps {
  debtId?: string;
}

export function DebtForm({ debtId }: DebtFormProps) {
  const router = useRouter();
  const {
    debts,
    debtTypes,
    addDebt,
    updateDebt,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();

  const [isDebtTypeModalOpen, setIsDebtTypeModalOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      description: "",
      originalAmount: 0,
      type: "credit_card_bill",
      isRecurring: false,
      totalInstallments: null,
      expectedInstallmentAmount: null,
      interestRate: 0,
      fineRate: null,
      startDate: "",
      endDate: null,
    },
  });

  const isRecurring = watch("isRecurring");
  const totalInstallments = watch("totalInstallments");

  useEffect(() => {
    if (debtId) {
      const existingDebt = debts.find((d) => d.id === debtId);
      if (existingDebt) {
        reset({
          description: existingDebt.description,
          originalAmount: existingDebt.originalAmount,
          type: existingDebt.type,
          isRecurring: existingDebt.isRecurring,
          totalInstallments: existingDebt.totalInstallments,
          expectedInstallmentAmount: existingDebt.expectedInstallmentAmount,
          interestRate: existingDebt.interestRate,
          fineRate: existingDebt.fineRate,
          startDate: existingDebt.startDate,
          // ALTERADO: Garante que endDate seja formatado corretamente para o input type="date"
          endDate: existingDebt.endDate
            ? format(
                parse(existingDebt.endDate, "yyyy-MM-dd", new Date()),
                "yyyy-MM-dd"
              )
            : null,
        });
      } else if (!loadingFinanceData && !errorFinanceData) {
        toast({
          title: "Erro",
          description: "Dívida não encontrada.",
          variant: "destructive",
        });
        router.back();
      }
    }
  }, [
    debtId,
    debts,
    loadingFinanceData,
    errorFinanceData,
    router,
    toast,
    reset,
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

  useEffect(() => {
    if (Object.keys(errors).length > 0 && !isSubmitting) {
      console.log("Erros de Validação (objeto completo): ", errors);
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os campos destacados no formulário.",
        variant: "destructive",
      });
    }
  }, [errors, isSubmitting, toast]);

  const onSubmit = async (data: DebtFormData) => {
    if (loadingFinanceData) {
      toast({
        title: "Aguarde",
        description:
          "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
        variant: "default",
      });
      return;
    }

    const debtToSave: Omit<
      Debt,
      | "id"
      | "uid"
      | "createdAt"
      | "currentOutstandingBalance"
      | "totalPaidOnThisDebt"
      | "totalInterestPaidOnThisDebt"
      | "totalFinePaidOnThisDebt"
      | "paidInstallments"
      | "isActive"
    > = {
      description: data.description,
      originalAmount: data.originalAmount,
      type: data.type,
      isRecurring: data.isRecurring,
      interestRate: data.interestRate,
      fineRate: data.fineRate,
      startDate: data.startDate,
      endDate: data.isRecurring ? null : data.endDate || null,
      totalInstallments: data.isRecurring
        ? null
        : data.totalInstallments || null,
      expectedInstallmentAmount: data.isRecurring
        ? null
        : data.expectedInstallmentAmount || null,
    };

    try {
      if (debtId) {
        await updateDebt(debtId, debtToSave);
        toast({
          title: "Sucesso",
          description: "Dívida atualizada com sucesso!",
          variant: "success",
        });
      } else {
        await addDebt(debtToSave);
        toast({
          title: "Sucesso",
          description: "Dívida cadastrada com sucesso!",
          variant: "success",
        });
        reset();
      }
      router.back();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a dívida.",
        variant: "destructive",
      });
      console.error("Erro ao salvar dívida:", error);
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
        <h1 className="text-2xl font-bold">
          {debtId ? "Editar Dívida" : "Cadastro de Dívida"}
        </h1>
        <div className="w-10 h-10"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Dívida</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Ex: Fatura Cartão Nubank, Empréstimo Pessoal"
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalAmount">Valor Original</Label>
              <Input
                id="originalAmount"
                type="number"
                step="0.01"
                {...register("originalAmount", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.originalAmount && (
                <p className="text-red-500 text-sm">
                  {errors.originalAmount.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) =>
                  setValue("isRecurring", checked as boolean)
                }
                disabled={isSubmitting || loadingFinanceData}
              />
              <Label htmlFor="isRecurring">
                Dívida Recorrente (Ex: Contas Fixas)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Dívida</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={watch("type") || "credit_card_bill"}
                  onValueChange={(value: Debt["type"]) =>
                    setValue("type", value)
                  }
                  disabled={isSubmitting || loadingFinanceData}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {debtTypes.map((dt) => (
                      <SelectItem key={dt.id} value={dt.name}>
                        {dt.name}
                      </SelectItem>
                    ))}
                    {!debtTypes.length && (
                      <>
                        <SelectItem value="credit_card_bill">
                          Fatura de Cartão de Crédito
                        </SelectItem>
                        <SelectItem value="loan">Empréstimo Pessoal</SelectItem>
                        <SelectItem value="financing">Financiamento</SelectItem>
                        <SelectItem value="overdraft">
                          Cheque Especial
                        </SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsDebtTypeModalOpen(true)}
                    disabled={isSubmitting || loadingFinanceData}
                  >
                    <Icon icon="mdi:plus" className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
              </div>
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>

            {!isRecurring && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="totalInstallments">
                    Total de Parcelas (Opcional)
                  </Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    {...register("totalInstallments", { valueAsNumber: true })}
                    placeholder="Ex: 12"
                    disabled={isSubmitting || loadingFinanceData}
                  />
                  {errors.totalInstallments && (
                    <p className="text-red-500 text-sm">
                      {errors.totalInstallments.message}
                    </p>
                  )}
                </div>

                {totalInstallments && totalInstallments > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="expectedInstallmentAmount">
                      Valor da Parcela
                    </Label>
                    <Input
                      id="expectedInstallmentAmount"
                      type="number"
                      step="0.01"
                      {...register("expectedInstallmentAmount", {
                        valueAsNumber: true,
                      })}
                      placeholder="0.00"
                      disabled={isSubmitting || loadingFinanceData}
                    />
                    {errors.expectedInstallmentAmount && (
                      <p className="text-red-500 text-sm">
                        {errors.expectedInstallmentAmount.message}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="interestRate">
                Taxa de Juros Anual (%) (Opcional)
              </Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                {...register("interestRate", { valueAsNumber: true })}
                placeholder="Ex: 12.5"
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.interestRate && (
                <p className="text-red-500 text-sm">
                  {errors.interestRate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fineRate">
                Taxa de Multa por Atraso (%) (Opcional)
              </Label>
              <Input
                id="fineRate"
                type="number"
                step="0.01"
                {...register("fineRate", { valueAsNumber: true })}
                placeholder="Ex: 2.0"
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.fineRate && (
                <p className="text-red-500 text-sm">
                  {errors.fineRate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                disabled={isSubmitting || loadingFinanceData}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            {!isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término (Opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  disabled={isSubmitting || loadingFinanceData}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting || loadingFinanceData}>
              {isSubmitting ? "Salvando..." : "Salvar Dívida"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DebtTypeModal
        isOpen={isDebtTypeModalOpen}
        onOpenChange={setIsDebtTypeModalOpen}
        loadingFinanceData={loadingFinanceData}
      />
    </div>
  );
}
