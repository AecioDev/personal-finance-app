"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DebtInstallment } from "@/interfaces/finance";
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
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  DebtInstallmentFormData,
  debtInstallmentSchema,
} from "@/schemas/debt-installment-schema";

interface DebtInstallmentFormContentProps {
  editingInstallment: DebtInstallment | null;
  onSave: (
    installmentData: Partial<Omit<DebtInstallment, "id" | "uid" | "createdAt">>
  ) => Promise<void>;
  loadingFinanceData: boolean;
  onClose: () => void;
}

export function DebtInstallmentFormContent({
  editingInstallment,
  onSave,
  loadingFinanceData,
  onClose,
}: DebtInstallmentFormContentProps) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DebtInstallmentFormData>({
    resolver: zodResolver(debtInstallmentSchema),
    defaultValues: {
      installmentNumber: null,
      expectedDueDate: "",
      expectedAmount: 0,
      status: "pending",
      actualPaidAmount: null,
      interestPaidOnInstallment: null,
      finePaidOnInstallment: null,
      paymentDate: null,
      transactionId: null,
    },
  });

  const installmentStatus = watch("status");

  useEffect(() => {
    if (editingInstallment) {
      reset({
        installmentNumber: editingInstallment.installmentNumber,
        expectedDueDate: editingInstallment.expectedDueDate,
        expectedAmount: editingInstallment.expectedAmount,
        status: editingInstallment.status,
        actualPaidAmount: editingInstallment.actualPaidAmount,
        interestPaidOnInstallment: editingInstallment.interestPaidOnInstallment,
        finePaidOnInstallment: editingInstallment.finePaidOnInstallment,
        paymentDate: editingInstallment.paymentDate,
        transactionId: editingInstallment.transactionId,
      });
    } else {
      reset();
    }
  }, [editingInstallment, reset]);

  useEffect(() => {
    if (Object.keys(errors).length > 0 && !isSubmitting) {
      console.log("Erros de Validação da Parcela (objeto completo): ", errors); // NOVO LOG AQUI
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os campos destacados no formulário.",
        variant: "destructive",
      });
    }
  }, [errors, isSubmitting, toast]);

  const onSubmit = async (data: DebtInstallmentFormData) => {
    if (loadingFinanceData) {
      toast({
        title: "Aguarde",
        description:
          "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
        variant: "default",
      });
      return;
    }

    const installmentToSave: Partial<
      Omit<DebtInstallment, "id" | "uid" | "createdAt">
    > = {
      installmentNumber: data.installmentNumber ?? 0,
      expectedDueDate: data.expectedDueDate,
      expectedAmount: data.expectedAmount,
      status: data.status,
      actualPaidAmount: data.actualPaidAmount,
      interestPaidOnInstallment: data.interestPaidOnInstallment,
      finePaidOnInstallment: data.finePaidOnInstallment,
      paymentDate: data.paymentDate,
      transactionId: data.transactionId,
    };

    try {
      await onSave(installmentToSave);
      onClose();
      toast({
        title: "Sucesso",
        description: editingInstallment
          ? "Parcela atualizada."
          : "Parcela adicionada.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a parcela.",
        variant: "destructive",
      });
      console.error("Erro ao salvar parcela no formulário:", error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="installmentNumber">Número da Parcela (Opcional)</Label>
        <Input
          id="installmentNumber"
          type="number"
          {...register("installmentNumber", { valueAsNumber: true })}
          placeholder="Ex: 1"
          disabled={isSubmitting || loadingFinanceData}
        />
        {errors.installmentNumber && (
          <p className="text-red-500 text-sm">
            {errors.installmentNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedDueDate">Data de Vencimento Esperada</Label>
        <Input
          id="expectedDueDate"
          type="date"
          {...register("expectedDueDate")}
          disabled={isSubmitting || loadingFinanceData}
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
          placeholder="0.00"
          disabled={isSubmitting || loadingFinanceData}
        />
        {errors.expectedAmount && (
          <p className="text-red-500 text-sm">
            {errors.expectedAmount.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={installmentStatus}
          onValueChange={(value: DebtInstallment["status"]) =>
            setValue("status", value)
          }
          disabled={isSubmitting || loadingFinanceData}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Paga</SelectItem>
            <SelectItem value="overdue">Atrasada</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-red-500 text-sm">{errors.status.message}</p>
        )}
      </div>

      {installmentStatus === "paid" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="actualPaidAmount">Valor Realmente Pago</Label>
            <Input
              id="actualPaidAmount"
              type="number"
              step="0.01"
              {...register("actualPaidAmount", { valueAsNumber: true })}
              placeholder="0.00"
              disabled={isSubmitting || loadingFinanceData}
            />
            {errors.actualPaidAmount && (
              <p className="text-red-500 text-sm">
                {errors.actualPaidAmount.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="interestPaidOnInstallment">
              Juros Pagos (Opcional)
            </Label>
            <Input
              id="interestPaidOnInstallment"
              type="number"
              step="0.01"
              {...register("interestPaidOnInstallment", {
                valueAsNumber: true,
              })}
              placeholder="0.00"
              disabled={isSubmitting || loadingFinanceData}
            />
            {errors.interestPaidOnInstallment && (
              <p className="text-red-500 text-sm">
                {errors.interestPaidOnInstallment.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="finePaidOnInstallment">Multa Paga (Opcional)</Label>
            <Input
              id="finePaidOnInstallment"
              type="number"
              step="0.01"
              {...register("finePaidOnInstallment", { valueAsNumber: true })}
              placeholder="0.00"
              disabled={isSubmitting || loadingFinanceData}
            />
            {errors.finePaidOnInstallment && (
              <p className="text-red-500 text-sm">
                {errors.finePaidOnInstallment.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data do Pagamento</Label>
            <Input
              id="paymentDate"
              type="date"
              {...register("paymentDate")}
              disabled={isSubmitting || loadingFinanceData}
            />
            {errors.paymentDate && (
              <p className="text-red-500 text-sm">
                {errors.paymentDate.message}
              </p>
            )}
          </div>
        </>
      )}

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || loadingFinanceData}>
          {isSubmitting ? "Salvando..." : "Salvar Parcela"}
        </Button>
      </DialogFooter>
    </form>
  );
}
