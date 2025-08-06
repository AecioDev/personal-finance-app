// src/components/finances/simple-transaction-form.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";

// Schema de validação para o formulário
const SimpleTransactionSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().min(1, "A data é obrigatória."),
  type: z.enum(["income", "expense"]),
  accountId: z.string().min(1, "Selecione uma conta."),
});

type SimpleTransactionFormData = z.infer<typeof SimpleTransactionSchema>;

interface SimpleTransactionFormProps {
  onFinished?: () => void;
}

export function SimpleTransactionForm({
  onFinished,
}: SimpleTransactionFormProps) {
  const { toast } = useToast();
  const { accounts, addGenericTransaction, loadingFinanceData } = useFinance();

  const form = useForm<SimpleTransactionFormData>({
    resolver: zodResolver(SimpleTransactionSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      type: "expense",
      accountId: accounts.length > 0 ? accounts[0].id : "",
    },
  });

  const onSubmit = async (data: SimpleTransactionFormData) => {
    try {
      await addGenericTransaction({
        ...data,
        date: new Date(data.date + "T00:00:00"), // Corrige o fuso horário
        // Campos não utilizados neste form simplificado
        category: "Geral",
        paymentMethodId: null,
        debtInstallmentId: null,
        isLoanIncome: false,
        loanSource: null,
        interestPaid: null,
        discountReceived: null,
      });
      toast({
        title: "Sucesso!",
        description: "Lançamento registrado.",
      });
      if (onFinished) {
        onFinished();
      }
      form.reset();
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível registrar o lançamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex justify-center gap-6"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal text-red-500">
                      Despesa
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal text-green-500">
                      Receita
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Almoço, Salário" {...field} />
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
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loadingFinanceData || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}
