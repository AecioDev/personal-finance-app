"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Icon } from "@iconify/react";
import { DebtTypeModal } from "@/components/debt-types/debt-type-modal";
import { DebtFormData, debtSchema } from "@/schemas/debt-schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Debt } from "@/interfaces/finance";

interface DebtFormProps {
  debtId?: string;
}

export function DebtForm({ debtId }: DebtFormProps) {
  const router = useRouter();
  const { debts, debtTypes, addDebt, updateDebt, loadingFinanceData } =
    useFinance();
  const { toast } = useToast();
  const [isDebtTypeModalOpen, setIsDebtTypeModalOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      description: "",
      originalAmount: 0,
      totalRepaymentAmount: null,
      type: "credit_card_bill",
      isRecurring: false,
      totalInstallments: null,
      expectedInstallmentAmount: null,
      startDate: new Date(),
    },
  });

  const isRecurring = watch("isRecurring");
  const totalInstallments = watch("totalInstallments");
  const expectedInstallmentAmount = watch("expectedInstallmentAmount");

  useEffect(() => {
    if (!isRecurring && totalInstallments && expectedInstallmentAmount) {
      const total = totalInstallments * expectedInstallmentAmount;
      setValue("totalRepaymentAmount", total);
    }
  }, [totalInstallments, expectedInstallmentAmount, isRecurring, setValue]);

  useEffect(() => {
    if (debtId) {
      const existingDebt = debts.find((d) => d.id === debtId);
      if (existingDebt) {
        const debtWithDateObjects = {
          ...existingDebt,
          startDate: new Date(existingDebt.startDate),
          endDate: existingDebt.endDate ? new Date(existingDebt.endDate) : null,
        };
        reset(debtWithDateObjects as DebtFormData);
      }
    }
  }, [debtId, debts, reset]);

  const onSubmit = async (data: DebtFormData) => {
    try {
      if (debtId) {
        const existingDebt = debts.find((d) => d.id === debtId);
        if (!existingDebt) {
          toast({
            title: "Erro",
            description: "Dívida original não encontrada para atualizar.",
            variant: "destructive",
          });
          return;
        }

        // GÊ: AQUI ESTÁ A NOVA LÓGICA!
        // Recalcula o saldo devedor com base no novo valor a pagar.
        const totalPaid = existingDebt.totalPaidOnThisDebt || 0;
        const newOutstandingBalance =
          (data.totalRepaymentAmount || data.originalAmount) - totalPaid;

        const dataToUpdate = {
          ...data,
          currentOutstandingBalance: newOutstandingBalance,
        };

        await updateDebt(debtId, dataToUpdate as Partial<Debt>);
        toast({
          title: "Sucesso",
          description: "Dívida atualizada!",
          variant: "success",
        });
      } else {
        await addDebt(data);
        toast({
          title: "Sucesso",
          description: "Dívida cadastrada!",
          variant: "success",
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
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" {...register("description")} />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalAmount">
                Valor Original (o que entrou na conta)
              </Label>
              <Input
                id="originalAmount"
                type="number"
                step="0.01"
                {...register("originalAmount", { valueAsNumber: true })}
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
              />
              <Label htmlFor="isRecurring">Dívida Recorrente</Label>
            </div>
            {!isRecurring && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="totalInstallments">Total de Parcelas</Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    {...register("totalInstallments", { valueAsNumber: true })}
                  />
                  {errors.totalInstallments && (
                    <p className="text-red-500 text-sm">
                      {errors.totalInstallments.message}
                    </p>
                  )}
                </div>
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
                  />
                  {errors.expectedInstallmentAmount && (
                    <p className="text-red-500 text-sm">
                      {errors.expectedInstallmentAmount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalRepaymentAmount">
                    Valor Total a Pagar (calculado)
                  </Label>
                  <Input
                    id="totalRepaymentAmount"
                    type="number"
                    step="0.01"
                    {...register("totalRepaymentAmount", {
                      valueAsNumber: true,
                    })}
                    readOnly
                    className="bg-muted/50"
                  />
                  {errors.totalRepaymentAmount && (
                    <p className="text-red-500 text-sm">
                      {errors.totalRepaymentAmount.message}
                    </p>
                  )}
                </div>
              </>
            )}
            <Button type="submit" disabled={isSubmitting || loadingFinanceData}>
              {isSubmitting ? "Salvando..." : "Salvar Dívida"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
