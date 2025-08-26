"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
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
import { CategoryManagerDialog } from "@/components/categories/category-manager-dialog";
import { Checkbox } from "../ui/checkbox";
import { DatePicker } from "../ui/date-picker";
import { CurrencyInput } from "../ui/currency-input";
import { AnimatePresence, motion } from "framer-motion";

interface SimpleDebtFormProps {
  onFinished?: () => void;
}

const defaultFormValues: Partial<SimpleDebtFormData> = {
  name: "",
  amount: undefined,
  categoryId: undefined,
  dueDate: new Date(),
  isRecurring: false,
  payNow: false,
  accountId: undefined,
  paymentMethodId: undefined,
};

export function SimpleDebtForm({ onFinished }: SimpleDebtFormProps) {
  const { toast } = useToast();
  const { categories, accounts, paymentMethods, addDebtAndPay, addDebt } =
    useFinance();
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    "save" | "saveAndNew" | null
  >(null);

  const form = useForm<SimpleDebtFormData>({
    resolver: zodResolver(SimpleDebtFormSchema),
    defaultValues: defaultFormValues,
  });

  const isRecurring = form.watch("isRecurring");
  const payNow = form.watch("payNow");

  const processSubmit = async (
    data: SimpleDebtFormData,
    andNew: boolean = false
  ) => {
    setSubmittingAction(andNew ? "saveAndNew" : "save");
    try {
      if (data.payNow) {
        await addDebtAndPay(data);
        toast({
          title: "Show!",
          description: "Despesa registrada e paga com sucesso!",
        });
      } else {
        const debtDataForApi = {
          description: data.name,
          type: "simple",
          originalAmount: data.amount,
          isRecurring: data.isRecurring || false,
          totalInstallments: 1,
          expectedInstallmentAmount: data.amount,
          startDate: data.dueDate,
          totalRepaymentAmount: data.amount,
          categoryId: data.categoryId,
          interestRate: null,
          fineRate: null,
          endDate: null,
        };
        await addDebt(debtDataForApi);
        toast({
          title: "Sucesso!",
          description: "Sua despesa foi registrada.",
        });
      }

      if (andNew) {
        form.reset(defaultFormValues);
      } else {
        onFinished?.();
      }
    } catch (error) {
      console.log("Erro: Não foi possível completar a operação." + error);
      toast({
        title: "Erro!",
        description: "Não foi possível completar a operação.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <>
      <Form {...form}>
        <form id="simple-debt-form" className="space-y-4 pt-4">
          {/* Campos principais */}
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
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="rounded-md border p-4 shadow-sm">
                  <div className="flex flex-row items-center space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) form.setValue("payNow", false);
                        }}
                      />
                    </FormControl>
                    <FormLabel>Recorrente?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payNow"
              render={({ field }) => (
                <FormItem className="rounded-md border p-4 shadow-sm">
                  <div className="flex flex-row items-center space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) form.setValue("isRecurring", false);
                        }}
                      />
                    </FormControl>
                    <FormLabel>Foi Pago?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pl-1 min-h-[32px]">
            {isRecurring && (
              <p>
                <strong>Recorrente:</strong> Gera parcelas mensais a partir do
                mês atual até Dezembro.
              </p>
            )}
            {payNow && (
              <p>
                <strong>Foi Pago:</strong> Marca a despesa como Paga e realiza a
                baixa no saldo da conta.
              </p>
            )}
          </div>

          <AnimatePresence>
            {payNow && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta Bancária</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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
                    name="paymentMethodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((pm) => (
                              <SelectItem key={pm.id} value={pm.id}>
                                {pm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Form>

      <div className="flex justify-end gap-2 pt-6">
        <Button
          variant="outline"
          onClick={form.handleSubmit((data) => processSubmit(data, true))}
          disabled={!!submittingAction}
        >
          {submittingAction === "saveAndNew" ? (
            <Icon icon="mdi:loading" className="animate-spin mr-2" />
          ) : (
            <Icon icon="mdi:plus" className="mr-2" />
          )}
          Salvar e Novo
        </Button>
        <Button
          onClick={form.handleSubmit((data) => processSubmit(data, false))}
          disabled={!!submittingAction}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submittingAction === "save" && (
            <Icon icon="mdi:loading" className="animate-spin mr-2" />
          )}
          Salvar Despesa
        </Button>
      </div>

      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />
    </>
  );
}
