"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SimpleDebtFormData,
  SimpleDebtFormSchema,
} from "@/schemas/simple-debt-schema";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "../ui/date-picker";
import { CurrencyInput } from "../ui/currency-input";
import { Debt } from "@/interfaces/finance";
import { Checkbox } from "../ui/checkbox";

interface SimpleDebtEditFormProps {
  debt: Debt;
  onFinished: () => void;
}

export function SimpleDebtEditForm({
  debt,
  onFinished,
}: SimpleDebtEditFormProps) {
  const { toast } = useToast();
  const { categories, updateSimpleDebt } = useFinance();

  // --- CORREÇÃO APLICADA AQUI (PARTE 1) ---
  // Preparamos os valores do formulário de forma segura com useMemo
  const formValues = useMemo(() => {
    return {
      name: debt.description,
      amount: debt.originalAmount,
      dueDate: new Date(debt.startDate),
      categoryId: debt.categoryId || "", // Garante que seja uma string
      isRecurring: debt.isRecurring,
      payNow: false, // Não é usado na edição, mas o schema espera
      // Campos opcionais do schema que podem não estar no 'debt'
      accountId: undefined,
      paymentMethodId: undefined,
    };
  }, [debt]);

  const form = useForm<SimpleDebtFormData>({
    resolver: zodResolver(SimpleDebtFormSchema),
    // --- CORREÇÃO APLICADA AQUI (PARTE 2) ---
    // Usamos 'values' para que o react-hook-form gerencie a atualização
    values: formValues,
  });

  // O useEffect com form.reset() foi removido.

  const onSubmit = async (data: SimpleDebtFormData) => {
    try {
      const updatedData: Partial<Debt> = {
        description: data.name,
        originalAmount: data.amount,
        expectedInstallmentAmount: data.amount,
        totalRepaymentAmount: data.amount,
        startDate: data.dueDate,
        categoryId: data.categoryId,
        isRecurring: data.isRecurring,
      };

      await updateSimpleDebt(debt.id, updatedData);

      toast({
        title: "Sucesso!",
        description: "Sua despesa foi atualizada.",
      });
      onFinished();
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível atualizar a despesa.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Conta de Luz - Agosto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <CurrencyInput {...field} value={field.value || 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Vencimento</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>É uma despesa recorrente?</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
