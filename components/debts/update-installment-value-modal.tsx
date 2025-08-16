// src/components/debts/update-installment-value-modal.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Label } from "@/components/ui/label";

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

  const initialValue =
    installment?.currentDueAmount || installment?.expectedAmount;

  const form = useForm<UpdateValueFormData>({
    resolver: zodResolver(UpdateValueSchema),
    defaultValues: {
      newAmount: initialValue,
    },
  });

  const watchedNewAmount = form.watch("newAmount");
  const originalAmount = installment?.expectedAmount || 0;
  const interest = watchedNewAmount ? watchedNewAmount - originalAmount : 0;

  // *** LÓGICA PARA CALCULAR DIAS DE ATRASO ***
  const daysOverdue = installment
    ? differenceInDays(new Date(), new Date(installment.expectedDueDate))
    : 0;
  const isOverdue = installment
    ? isPast(new Date(installment.expectedDueDate)) && daysOverdue > 0
    : false;

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
          <DialogDescription>{debt?.description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            {/* *** NOVAS INFORMAÇÕES DE VENCIMENTO E ATRASO *** */}
            {installment && (
              <div className="text-sm p-3 bg-muted/50 rounded-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento:</span>
                  <span className="font-medium">
                    {format(
                      new Date(installment.expectedDueDate),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                {isOverdue && (
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold text-red-500">
                      Atrasada há {daysOverdue}{" "}
                      {daysOverdue > 1 ? "dias" : "dia"}
                    </span>
                  </div>
                )}
              </div>
            )}

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
              <Label>Juros/Encargos (Calculado)</Label>
              <Input
                readOnly
                disabled
                value={interest.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                className={
                  interest > 0
                    ? "text-red-500 font-semibold"
                    : interest < 0
                    ? "text-green-500 font-semibold"
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
