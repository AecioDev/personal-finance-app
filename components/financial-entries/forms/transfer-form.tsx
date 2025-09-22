// in: components/financial-entries/forms/transfer-form.tsx

"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";
import { TransferFormData, TransferSchema } from "@/schemas/transfer-schema";

interface TransferFormProps {
  onFinished?: () => void;
}

export function TransferForm({ onFinished }: TransferFormProps) {
  const { toast } = useToast();
  const { accounts, createTransfer } = useFinance();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(TransferSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      date: new Date(),
      sourceAccountId: "",
      destinationAccountId: "",
      notes: "",
    },
  });

  const onSubmit = async (data: TransferFormData) => {
    try {
      await createTransfer(data);
      toast({ title: "Sucesso!", description: "Transferência registrada." });
      if (onFinished) onFinished();
    } catch (error) {
      toast({
        title: "Erro",
        description: `Não foi possível salvar a transferência: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Pagamento Fatura, Reserva..."
                  {...field}
                />
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
                  <CurrencyInput
                    placeholder="R$ 0,00"
                    value={field.value}
                    onChange={field.onChange}
                  />
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

        <div className="grid grid-cols-2 gap-4 items-center">
          <FormField
            control={form.control}
            name="sourceAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta de Origem</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="De onde saiu..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
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
            name="destinationAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta de Destino</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Para onde foi..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Alguma anotação..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="bg-primary text-primary-foreground"
            disabled={form.formState.isSubmitting}
          >
            <Icon icon="mdi:swap-horizontal" className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting
              ? "Salvando..."
              : "Salvar Transferência"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
