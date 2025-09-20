// src/components/forms/financial-entry-payment-form.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { DatePicker } from "@/components/ui/date-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PaymentFormData } from "@/schemas/payment-schema";
import { useFinance } from "@/components/providers/finance-provider";

interface TextContent {
  amountLabel: string;
  dateLabel: string;
  accountLabel: string;
  submitButton: string;
  submittingButton: string;
}

interface FinancialEntryPaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  textContent: TextContent;
}

export function FinancialEntryPaymentForm({
  onSubmit,
  textContent,
}: FinancialEntryPaymentFormProps) {
  const form = useFormContext<PaymentFormData>();
  const { accounts, paymentMethods } = useFinance();
  const {
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{textContent.amountLabel}</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="R$ 0,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{textContent.dateLabel}</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{textContent.accountLabel}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (Saldo:{" "}
                      {account.balance?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                      )
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
          name="paymentMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground"
            disabled={isSubmitting}
          >
            <Icon icon="mdi:cash-check" className="mr-2 h-4 w-4" />
            {isSubmitting
              ? textContent.submittingButton
              : textContent.submitButton}
          </Button>
        </div>
      </form>
    </Form>
  );
}
