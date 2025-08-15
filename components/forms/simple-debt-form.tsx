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

interface SimpleDebtFormProps {
  onFinished?: () => void;
}

const defaultFormValues: Partial<SimpleDebtFormData> = {
  name: "",
  amount: undefined,
  categoryId: undefined,
  dueDate: undefined,
  isRecurring: false,
};

export function SimpleDebtForm({ onFinished }: SimpleDebtFormProps) {
  const { toast } = useToast();
  const { categories, addDebt, loadingFinanceData } = useFinance();
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAndNew, setIsSubmittingAndNew] = useState(false);

  const form = useForm<SimpleDebtFormData>({
    resolver: zodResolver(SimpleDebtFormSchema),
    defaultValues: defaultFormValues,
  });

  const handleSave = async (
    data: SimpleDebtFormData,
    closeOnFinish: boolean
  ) => {
    if (closeOnFinish) {
      setIsSubmitting(true);
    } else {
      setIsSubmittingAndNew(true);
    }

    const debtDataForApi = {
      description: data.name,
      type: "simple",
      originalAmount: data.amount,
      isRecurring: data.isRecurring || false,
      totalInstallments: 1,
      expectedInstallmentAmount: data.amount,
      interestRate: 0,
      fineRate: 0,
      startDate: data.dueDate,
      endDate: data.dueDate,
      totalRepaymentAmount: data.amount,
      paymentDay: null,
      paidAmount: 0,
      categoryId: data.categoryId,
    };

    try {
      await addDebt(debtDataForApi);
      toast({
        title: "Sucesso!",
        description: "Sua despesa foi registrada.",
      });

      if (closeOnFinish && onFinished) {
        onFinished();
      } else {
        form.reset(defaultFormValues);
      }
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível registrar a despesa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsSubmittingAndNew(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form id="simple-debt-form" className="space-y-6 pt-4">
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
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$ 150,00"
                      {...field}
                      value={field.value ?? ""}
                    />
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
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Despesa Recorrente?</FormLabel>
                  <FormDescription>
                    Marque para criar parcelas mensais até o final do ano.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className="flex justify-end gap-4 pt-6">
        <Button
          variant="outline"
          onClick={form.handleSubmit((data) => handleSave(data, false))}
          disabled={isSubmitting || isSubmittingAndNew}
        >
          {isSubmittingAndNew ? "Salvando..." : "Cadastrar +"}
        </Button>
        <Button
          onClick={form.handleSubmit((data) => handleSave(data, true))}
          disabled={isSubmitting || isSubmittingAndNew}
        >
          {isSubmitting ? "Salvando..." : "Cadastrar"}
        </Button>
      </div>

      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />
    </>
  );
}
