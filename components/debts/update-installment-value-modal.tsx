// src/components/debts/update-installment-value-modal.tsx
"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Label } from "../ui/label";

// Schema de validação para o nosso novo formulário
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

  const form = useForm<UpdateValueFormData>({
    resolver: zodResolver(UpdateValueSchema),
    // O formulário já começa com o valor atual da parcela
    defaultValues: {
      newAmount: installment?.expectedAmount,
    },
  });

  // Observa o valor do campo 'newAmount' em tempo real
  const watchedNewAmount = form.watch("newAmount");
  const originalAmount = installment?.expectedAmount || 0;
  // Calcula os juros em tempo real
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
      await updateInstallmentValue(debt.id, installment.id, data.newAmount);
      toast({ title: "Sucesso!", description: "Valor da parcela atualizado." });
      onOpenChange(false); // Fecha o modal
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível atualizar o valor.",
        variant: "destructive",
      });
    }
  };

  // Reseta o formulário toda vez que o modal abre com uma nova parcela
  React.useEffect(() => {
    if (installment) {
      form.reset({ newAmount: installment.expectedAmount });
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
            {/* Campo Valor Original (Apenas leitura) */}
            <div>
              <Label>Valor Original</Label>
              <Input
                readOnly
                disabled
                value={originalAmount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              />
            </div>

            {/* Campo Valor Atual (Editável) */}
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

            {/* Campo Juros (Calculado automaticamente) */}
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
