"use client";

import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
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
import { DebtInstallment } from "@/interfaces/finance";
import { PartialPaymentFormData } from "@/schemas/partial-payment-schema";
import { useFinance } from "../providers/finance-provider";
import { useToast } from "../ui/use-toast";
import { Input } from "../ui/input";
import { getDDMMYYYY } from "@/lib/dates";

interface InstallmentPaymentFormProps {
  onSubmit: (data: PartialPaymentFormData) => void;
  installment: DebtInstallment;
}

export function InstallmentPaymentForm({
  onSubmit,
  installment,
}: InstallmentPaymentFormProps) {
  const form = useFormContext<PartialPaymentFormData>();
  const { accounts, paymentMethods } = useFinance();
  const { toast } = useToast();
  const {
    setValue,
    watch,
    formState: { isSubmitting },
  } = form;

  const amountPaid = watch("amount");
  const interestPaidValue = watch("interestPaid");
  const discountReceivedValue = watch("discountReceived");
  const [discountSuggestion, setDiscountSuggestion] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (amountPaid === null || isNaN(amountPaid)) return;

    const remainingAmount =
      installment.remainingAmount ?? installment.expectedAmount;

    if (amountPaid > remainingAmount) {
      setValue("interestPaid", amountPaid - remainingAmount);
      setValue("discountReceived", 0);
      setDiscountSuggestion(null);
    } else if (amountPaid < remainingAmount && amountPaid > 0) {
      setDiscountSuggestion(remainingAmount - amountPaid);
      setValue("interestPaid", 0);
    } else {
      setValue("interestPaid", 0);
      setDiscountSuggestion(null);
    }
  }, [amountPaid, installment, setValue]);

  useEffect(() => {
    if (interestPaidValue && interestPaidValue > 0) {
      setValue("discountReceived", 0);
    }
  }, [interestPaidValue, setValue]);

  useEffect(() => {
    if (discountReceivedValue && discountReceivedValue > 0) {
      setValue("interestPaid", 0);
    }
  }, [discountReceivedValue, setValue]);

  const handleApplyDiscount = () => {
    if (discountSuggestion === null) return;
    setValue("discountReceived", discountSuggestion);
    setDiscountSuggestion(null);
    toast({ title: "Desconto aplicado com sucesso!" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                Clique para adicionar a diferença de R${" "}
                {discountSuggestion.toFixed(2)} como desconto.
              </span>
              <Button type="button" size="sm" onClick={handleApplyDiscount}>
                Aplicar como Desconto
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="interestPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Juros / Multa Pagos</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    disabled={(discountReceivedValue || 0) > 0}
                  />
                </FormControl>
                <FormDescription>Parte do valor que foi juros.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountReceived"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto Recebido</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    disabled={(interestPaidValue || 0) > 0}
                  />
                </FormControl>
                <FormDescription>Valor abatido do total.</FormDescription>
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
            <FormItem className="flex flex-col">
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
              <FormLabel>Pagar com a Conta</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta de origem..." />
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
                    <SelectValue placeholder="Selecione a forma de pagamento..." />
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
            {isSubmitting ? "Registrando..." : "Confirmar Pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
