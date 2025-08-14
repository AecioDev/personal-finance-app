// src/components/debts/update-installment-value-modal.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { Debt, DebtInstallment } from "@/interfaces/finance";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@radix-ui/react-label";

const UpdateValueSchema = z.object({
  newAmount: z.coerce
    .number({ invalid_type_error: "O valor deve ser um número" })
    .positive("O valor deve ser maior que zero."),
});
type UpdateValueFormData = z.infer<typeof UpdateValueSchema>;

interface UpdateInstallmentValueModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  debt: Debt | null;
  installment: DebtInstallment | null;
}

export function UpdateInstallmentValueModal({
  isOpen,
  onOpenChange,
  debt,
  installment,
}: UpdateInstallmentValueModalProps) {
  const { toast } = useToast();
  const { updateInstallmentValue } = useFinance();

  // O valor inicial do form agora pega o `currentDueAmount` se existir,
  // ou o `expectedAmount` como fallback.
  const initialValue =
    installment?.currentDueAmount || installment?.expectedAmount;

  const form = useForm<UpdateValueFormData>({
    resolver: zodResolver(UpdateValueSchema),
    defaultValues: {
      newAmount: initialValue,
    },
  });

  const watchedNewAmount = form.watch("newAmount");
  // O valor original NUNCA MUDA. É a nossa base de cálculo.
  const originalAmount = installment?.expectedAmount || 0;
  const interest = watchedNewAmount ? watchedNewAmount - originalAmount : 0;

  const onSubmit = async (data: UpdateValueFormData) => {
    if (!debt || !installment) {
      toast({
        title: "Erro",
        description: "Dívida ou parcela não encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      // A função do CRUD já sabe o que fazer com este novo valor.
      await updateInstallmentValue(debt.id, installment.id, data.newAmount);
      toast({ title: "Sucesso!", description: "Valor da parcela atualizado." });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível atualizar o valor.",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    if (installment) {
      const value = installment.currentDueAmount || installment.expectedAmount;
      form.reset({ newAmount: value });
    }
  }, [installment, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Valor da Parcela</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <div>
              <Label>Valor Original (Previsto)</Label>
              <Input
                readOnly
                disabled
                value={originalAmount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              />
            </div>

            <FormField
              control={form.control}
              name="newAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Atual da Parcela</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Juros/Encargos</Label>
              <Input
                readOnly
                disabled
                value={interest.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                className={
                  interest > 0
                    ? "text-red-500"
                    : interest < 0
                    ? "text-green-500"
                    : ""
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : "Salvar Novo Valor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
