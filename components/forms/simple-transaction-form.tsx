// src/components/finances/simple-transaction-form.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { CurrencyInput } from "../ui/currency-input";
import { DatePicker } from "../ui/date-picker";
import {
  SimpleTransactionFormData,
  SimpleTransactionSchema,
} from "@/schemas/simple-transaction-schema";
import { Icon } from "@iconify/react";

interface SimpleTransactionFormProps {
  onFinished?: () => void;
}

const defaultFormValues: Partial<SimpleTransactionFormData> = {
  description: "",
  amount: undefined,
  type: undefined,
  categoryId: undefined,
  date: undefined,
  accountId: "",
};

export function SimpleTransactionForm({
  onFinished,
}: SimpleTransactionFormProps) {
  const { toast } = useToast();
  const { accounts, categories, addGenericTransaction, loadingFinanceData } =
    useFinance();
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAndNew, setIsSubmittingAndNew] = useState(false);

  const form = useForm<SimpleTransactionFormData>({
    resolver: zodResolver(SimpleTransactionSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: SimpleTransactionFormData) => {
    try {
      await addGenericTransaction({
        ...data,
        date: data.date,
        categoryId: data.categoryId,
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
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal text-green-500">
                      Receita
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal text-red-500">
                      Despesa
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

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <div className="flex items-center gap-2">
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <Icon icon={cat.icon} />
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCategoryManagerOpen(true)}
                >
                  <Icon icon="mdi:plus" />
                </Button>
              </div>
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
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
