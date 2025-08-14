"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DebtInstallment } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { toDateInputValue, parseDateFromInputValue } from "@/lib/dates";

const simplifiedInstallmentSchema = z.object({
  expectedDueDate: z.string().min(1, "A data de vencimento é obrigatória."),
  expectedAmount: z.number().positive("O valor esperado deve ser positivo."),
});

type SimplifiedInstallmentFormData = z.infer<
  typeof simplifiedInstallmentSchema
>;

interface DebtInstallmentFormContentProps {
  editingInstallment: DebtInstallment | null;
  onSave: (installmentData: Partial<DebtInstallment>) => Promise<void>;
  loading: boolean;
  onClose: () => void;
}

export function DebtInstallmentFormContent({
  editingInstallment,
  onSave,
  loading,
  onClose,
}: DebtInstallmentFormContentProps) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SimplifiedInstallmentFormData>({
    resolver: zodResolver(simplifiedInstallmentSchema),
  });

  useEffect(() => {
    if (editingInstallment) {
      reset({
        expectedDueDate: toDateInputValue(editingInstallment.expectedDueDate),
        expectedAmount: editingInstallment.expectedAmount,
      });
    }
  }, [editingInstallment, reset]);

  const onSubmit = async (data: SimplifiedInstallmentFormData) => {
    if (!editingInstallment) return;

    const installmentToSave: Partial<DebtInstallment> = {
      expectedDueDate: parseDateFromInputValue(data.expectedDueDate),
      expectedAmount: data.expectedAmount,
      // Recalcula o valor restante baseado no novo valor esperado
      remainingAmount:
        data.expectedAmount -
        (editingInstallment.paidAmount || 0) -
        (editingInstallment.discountAmount || 0),
    };

    try {
      await onSave(installmentToSave);
      onClose();
      toast({
        title: "Sucesso",
        description: "Parcela atualizada.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a parcela.",
        variant: "destructive",
      });
    }
  };

  function handleClose(): void {
    onClose();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="expectedDueDate">Data de Vencimento</Label>
        <Input
          id="expectedDueDate"
          type="date"
          {...register("expectedDueDate")}
          disabled={isSubmitting || loading}
        />
        {errors.expectedDueDate && (
          <p className="text-red-500 text-sm">
            {errors.expectedDueDate.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedAmount">Valor Esperado</Label>
        <Input
          id="expectedAmount"
          type="number"
          step="0.01"
          {...register("expectedAmount", { valueAsNumber: true })}
          disabled={isSubmitting || loading}
        />
        {errors.expectedAmount && (
          <p className="text-red-500 text-sm">
            {errors.expectedAmount.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || loading}>
        {isSubmitting ? "Salvando..." : "Salvar Alterações"}
      </Button>
      <Button type="button" variant="outline" onClick={() => handleClose()}>
        Fechar
      </Button>
    </form>
  );
}
