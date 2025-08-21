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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { DatePicker } from "@/components/ui/date-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Account, DebtInstallment, PaymentMethod } from "@/interfaces/finance";
import { PartialPaymentFormData } from "@/schemas/partial-payment-schema";
import { getDDMMYYYY } from "@/lib/dates"; // <-- Importa a função de formatação
import { Input } from "@/components/ui/input";

interface InstallmentPaymentFormProps {
  onSubmit: (data: PartialPaymentFormData) => void;
  installment: DebtInstallment;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  discountSuggestion: number | null;
  handleApplyDiscount: () => void;
  isSubmitting: boolean;
}

export function InstallmentPaymentForm({
  onSubmit,
  installment,
  accounts,
  paymentMethods,
  discountSuggestion,
  handleApplyDiscount,
  isSubmitting,
}: InstallmentPaymentFormProps) {
  const form = useFormContext<PartialPaymentFormData>();
  const amountPaid = form.watch("amount");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Pago</FormLabel>
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

        {discountSuggestion !== null && (
          <Alert>
            <Icon icon="mdi:lightbulb-on-outline" className="h-4 w-4" />
            <AlertTitle>Dica do Assistente</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>
                A diferença de R$ {discountSuggestion.toFixed(2)} pode quitar a
                parcela.
              </span>
              <Button type="button" size="sm" onClick={handleApplyDiscount}>
                Aplicar como Desconto
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="interestPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Juros / Multa</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    placeholder="R$ 0,00"
                    readOnly={amountPaid > (installment.expectedAmount ?? 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountReceived"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    placeholder="R$ 0,00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem>
          <FormLabel>Data de Vencimento</FormLabel>
          <FormControl>
            <Input
              value={getDDMMYYYY(installment.expectedDueDate)}
              readOnly
              className="cursor-default focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </FormControl>
        </FormItem>

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Pagamento</FormLabel>
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
              <FormLabel>Conta Utilizada</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta..." />
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

        <FormField
          control={form.control}
          name="paymentMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma..." />
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Icon icon="mdi:cash-check" className="mr-2 h-4 w-4" />
            {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
