// in: components/financial-entries/financial-entry-form.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import {
  FinancialEntryFormData,
  FinancialEntrySchema,
} from "@/schemas/financial-entry-schema";
import { useFinance } from "../providers/finance-provider";
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
import { DatePicker } from "../ui/date-picker";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { CurrencyInput } from "../ui/currency-input";
import { CategoryManagerDialog } from "../categories/category-manager-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { EntryType } from "@/interfaces/financial-entry";

// 1. A prop 'entryType' foi adicionada
interface FinancialEntryFormProps {
  onFinished?: () => void;
  entryType: EntryType;
}

export function FinancialEntryForm({
  onFinished,
  entryType,
}: FinancialEntryFormProps) {
  const { toast } = useToast();
  const {
    accounts,
    categories,
    paymentMethods,
    addFinancialEntry,
    addInstallmentEntry,
    addMonthlyRecurringEntries,
  } = useFinance();
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    "save" | "saveAndNew" | null
  >(null);

  // 2. Os valores padrão agora são uma função para usar a prop 'entryType'
  const getDefaultValues = (): Partial<FinancialEntryFormData> => ({
    description: "",
    expectedAmount: undefined,
    dueDate: new Date(),
    type: entryType, // Usando a prop aqui
    categoryId: "",
    entryFrequency: "single",
    payNow: entryType === "income", // Receitas já vêm como 'pagas'
    totalInstallments: undefined,
    accountId: undefined,
    paymentMethodId: undefined,
    notes: "",
  });

  const form = useForm<FinancialEntryFormData>({
    resolver: zodResolver(FinancialEntrySchema),
    defaultValues: getDefaultValues(),
  });

  // Efeito para resetar o formulário se o tipo mudar (caso raro, mas bom ter)
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [entryType]);

  const entryFrequency = form.watch("entryFrequency");
  const payNow = form.watch("payNow");

  const processSubmit = async (
    data: FinancialEntryFormData,
    andNew: boolean = false
  ) => {
    setSubmittingAction(andNew ? "saveAndNew" : "save");
    try {
      if (data.entryFrequency === "recurring") {
        await addMonthlyRecurringEntries(data);
        toast({
          title: "Sucesso!",
          description: "Despesas recorrentes criadas.",
        });
      } else if (data.entryFrequency === "installment") {
        await addInstallmentEntry(data);
        toast({ title: "Sucesso!", description: "Despesa parcelada criada." });
      } else {
        const finalData = {
          ...data,
          status: data.payNow ? ("paid" as const) : ("pending" as const),
          paidAmount: data.payNow ? data.expectedAmount : null,
          paymentDate: data.payNow ? new Date() : null,
          totalInstallments: 0,
        };
        await addFinancialEntry(finalData);
        toast({ title: "Sucesso!", description: "Seu lançamento foi salvo." });
      }

      if (andNew) {
        form.reset(getDefaultValues());
        form.setFocus("description");
      } else {
        onFinished?.();
      }
    } catch (error) {
      console.error("Falha ao salvar lançamento", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar seu lançamento.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <>
      <Form {...form}>
        <form id="financial-entry-form" className="space-y-4 pt-4">
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Conta de Luz, Salário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="expectedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value || 0}
                      onChange={field.onChange}
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
                  <FormLabel>Data / Vencimento</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {entryType === "expense" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Único</SelectItem>
                        <SelectItem value="recurring">Recorrente</SelectItem>
                        <SelectItem value="installment">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {entryFrequency === "single" && (
                <FormField
                  control={form.control}
                  name="payNow"
                  render={({ field }) => (
                    <FormItem className="flex h-full items-center justify-center rounded-md border p-4 shadow-sm">
                      <div className="flex flex-row items-center space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Já foi pago?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}

          <AnimatePresence>
            {entryFrequency === "installment" && entryType === "expense" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <FormField
                  control={form.control}
                  name="totalInstallments"
                  render={({ field }) => (
                    <FormItem className="pt-2">
                      <FormLabel>Total de Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 12"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
                        <FormLabel>
                          {entryType === "income"
                            ? "Receber na conta"
                            : "Pagar com a conta"}
                        </FormLabel>
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
                        <FormLabel>Forma de Pag./Receb.</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Opcional" />
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
          Salvar
        </Button>
      </div>

      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />
    </>
  );
}
