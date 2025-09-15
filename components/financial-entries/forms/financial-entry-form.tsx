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
import { AnimatePresence, motion } from "framer-motion";
import { EntryType, FinancialEntry } from "@/interfaces/financial-entry";
import { useFinance } from "@/components/providers/finance-provider";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CategoryManagerDialog } from "@/components/categories/category-manager-dialog";
import { Switch } from "@/components/ui/switch";

// Helper components para ícones
const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-5 w-5 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
const PlusIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

interface FinancialEntryFormProps {
  onFinished?: () => void;
  entryType: EntryType;
  entryToEdit?: FinancialEntry | null;
}

export function FinancialEntryForm({
  onFinished,
  entryType,
  entryToEdit,
}: FinancialEntryFormProps) {
  const { toast } = useToast();
  const { accounts, categories, paymentMethods, addFinancialEntry } =
    useFinance();

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    "save" | "saveAndNew" | null
  >(null);

  const isEditing = !!entryToEdit;

  // Helper para obter os valores padrão do formulário
  const getDefaultValues = (): Partial<FinancialEntryFormData> => ({
    description: "",
    expectedAmount: undefined,
    notes: "",
    categoryId: "",
    type: entryType,
    entryFrequency: "single",
    dueDate: new Date(),
    payNow: entryType === "income",
    accountId: undefined,
    paymentMethodId: undefined,
  });

  const form = useForm<FinancialEntryFormData>({
    resolver: zodResolver(FinancialEntrySchema),
    defaultValues: getDefaultValues(),
  });

  const entryFrequency = form.watch("entryFrequency");
  const payNow = entryFrequency === "single" ? form.watch("payNow") : false;

  // Efeito para popular o formulário quando `entryToEdit` muda
  useEffect(() => {
    if (isEditing && entryToEdit) {
      // Montamos um objeto base com os campos comuns a todos
      const baseData = {
        description: entryToEdit.description,
        expectedAmount: entryToEdit.expectedAmount,
        type: entryToEdit.type,
        categoryId: entryToEdit.categoryId || "",
        notes: entryToEdit.notes || "",
      };

      // Verificamos se é um lançamento simples (não tem recurrenceId)
      if (!entryToEdit.recurrenceId) {
        form.reset({
          ...baseData,
          entryFrequency: "single",
          dueDate: entryToEdit.dueDate
            ? new Date(entryToEdit.dueDate)
            : new Date(),
          payNow: entryToEdit.status === "paid",
          accountId: entryToEdit.accountId || undefined,
          paymentMethodId: entryToEdit.paymentMethodId || undefined,
        });
      } else {
        // É parte de uma recorrência ou parcelamento
        const isInstallment =
          entryToEdit.totalInstallments && entryToEdit.totalInstallments > 0;

        if (isInstallment) {
          // Se for parcelamento
          form.reset({
            ...baseData,
            entryFrequency: "installment",
            startDate: entryToEdit.dueDate
              ? new Date(entryToEdit.dueDate)
              : new Date(),
            totalInstallments: entryToEdit.totalInstallments || undefined,
          });
        } else {
          // Se for uma recorrência (mensal, semanal, etc.)
          // Usamos 'monthly' como um placeholder seguro, já que o campo está desabilitado na edição.
          form.reset({
            ...baseData,
            entryFrequency: "monthly",
            startDate: entryToEdit.dueDate
              ? new Date(entryToEdit.dueDate)
              : new Date(),
          });
        }
      }
    }
  }, [entryToEdit, isEditing, form]);

  // Efeito para alternar os campos dinâmicos ao CRIAR um novo lançamento
  useEffect(() => {
    if (isEditing) return;

    const newFrequency = form.watch("entryFrequency");

    if (newFrequency === "single") {
      form.unregister("startDate");
      form.unregister("totalInstallments");
      form.setValue("dueDate", new Date());
      form.setValue("payNow", entryType === "income");
    } else {
      form.unregister("dueDate");
      form.unregister("payNow");
      form.setValue("startDate", new Date());
      if (newFrequency !== "installment") {
        form.unregister("totalInstallments");
      }
    }
  }, [entryFrequency, form, entryType, isEditing]);

  const processSubmit = async (
    data: FinancialEntryFormData,
    andNew: boolean = false
  ) => {
    setSubmittingAction(andNew ? "saveAndNew" : "save");
    try {
      if (isEditing) {
        // TODO: Chamar a função de update (ainda não implementada)
        console.log("Atualizando dados:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast({ title: "Sucesso!", description: "Lançamento atualizado." });
      } else {
        await addFinancialEntry(data);
        toast({ title: "Sucesso!", description: "Seu lançamento foi salvo." });
      }

      if (andNew && !isEditing) {
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
        <form
          onSubmit={form.handleSubmit((data) => processSubmit(data))}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      entryType === "income"
                        ? "Ex: Salário, Venda..."
                        : "Ex: Aluguel, Compra..."
                    }
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
              name="expectedAmount"
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
              name="entryFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Direta</SelectItem>
                        <SelectItem value="installment">Parcelada</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl className="flex-1">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCategoryManagerOpen(true)}
                  >
                    <PlusIcon />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={entryFrequency}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {entryFrequency === "single" && (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {entryFrequency !== "single" && (
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {entryFrequency === "installment"
                          ? "Data da 1ª Parcela"
                          : "Data de Início"}
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {entryFrequency === "installment" && (
                <FormField
                  control={form.control}
                  name="totalInstallments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 12"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              parseInt(e.target.value, 10) || undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {entryFrequency === "single" && (
            <FormField
              control={form.control}
              name="payNow"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {entryType === "income"
                        ? "Recebimento efetuado?"
                        : "Pagamento efetuado?"}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <AnimatePresence>
            {payNow && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meio de Pagamento</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentMethods.map((pm) => (
                                <SelectItem key={pm.id} value={pm.id}>
                                  {pm.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
          <button type="submit" className="hidden" />
        </form>
      </Form>

      <div className="flex justify-end gap-2 pt-6">
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit((data) => processSubmit(data, true))}
            disabled={!!submittingAction}
          >
            {submittingAction === "saveAndNew" ? (
              <LoadingSpinner />
            ) : (
              <PlusIcon className="mr-2 h-4 w-4" />
            )}
            Salvar e Novo
          </Button>
        )}
        <Button
          type="button"
          onClick={form.handleSubmit((data) => processSubmit(data, false))}
          disabled={!!submittingAction}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submittingAction === "save" && <LoadingSpinner />}
          {isEditing ? "Salvar Alterações" : "Salvar Lançamento"}
        </Button>
      </div>

      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />
    </>
  );
}
