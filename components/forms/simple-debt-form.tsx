// src/components/finances/simple-debt-form.tsx
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CategoryManagerDialog } from "@/components/categories/category-manager-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SimpleDebtFormProps {
  onFinished?: () => void;
}

const defaultFormValues: Partial<SimpleDebtFormData> = {
  name: "",
  amount: undefined,
  categoryId: undefined,
  dueDate: undefined,
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
      isRecurring: false,
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <Icon
                            icon="mdi:calendar"
                            className="ml-auto h-4 w-4 opacity-50"
                          />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
