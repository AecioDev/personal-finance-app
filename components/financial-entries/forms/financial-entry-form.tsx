"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  EntryType,
  FinancialEntry,
  FinancialRecurrence,
} from "@/interfaces/financial-entry";
import { useFinance } from "@/components/providers/finance-provider";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CategoryManagerDialog } from "@/components/categories/category-manager-dialog";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

// ... (Helpers de ícones) ...
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
  entryToEdit?: FinancialRecurrence | FinancialEntry | null;
}

export function FinancialEntryForm({
  onFinished,
  entryType,
  entryToEdit,
}: FinancialEntryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    accounts,
    categories,
    paymentMethods,
    addFinancialEntry,
    updateFinancialEntry,
  } = useFinance();

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    "save" | "saveAndNew" | null
  >(null);

  const isEditing = !!entryToEdit;

  const getDefaultValues = (): Partial<FinancialEntryFormData> => ({
    description: "",
    expectedAmount: undefined,
    notes: "",
    categoryId: "",
    type: entryType,
    entryFrequency: "single",
    dueDate: new Date(),
    payNow: entryType === "income",
    paymentDate: new Date(),
  });

  const form = useForm<FinancialEntryFormData>({
    resolver: zodResolver(FinancialEntrySchema),
    defaultValues: getDefaultValues(),
  });

  const entryFrequency = form.watch("entryFrequency");
  const payNow = entryFrequency === "single" ? form.watch("payNow") : false;

  // Usamos o `useMemo` para criar uma nova lista de categorias filtradas.
  // Essa lista só será recalculada se a lista principal de `categories` ou o `entryType` mudarem.
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => cat.type === entryType);
  }, [categories, entryType]);

  useEffect(() => {
    if (isEditing && entryToEdit) {
      const isRecurrenceRule = "frequency" in entryToEdit;

      // Setando os valores comuns a ambos os tipos
      form.setValue("description", entryToEdit.description);
      form.setValue("expectedAmount", entryToEdit.expectedAmount);
      form.setValue("type", entryToEdit.type);
      form.setValue("categoryId", entryToEdit.categoryId || "");
      form.setValue("notes", entryToEdit.notes || "");

      if (isRecurrenceRule) {
        const rule = entryToEdit as FinancialRecurrence;

        console.log("rule: ", rule);

        // Setando os valores específicos da Recorrência
        form.setValue("entryFrequency", rule.frequency);
        form.setValue("startDate", rule.startDate); // O dado já vem convertido do hook
        if (rule.frequency === "installment") {
          form.setValue("totalInstallments", rule.totalOccurrences || 0);
        } else {
          // Limpa o campo de parcelas se não for do tipo installment
          form.setValue("totalInstallments", 0);
        }
      } else {
        const entry = entryToEdit as FinancialEntry;

        console.log("entry: ", entry);

        // Setando os valores específicos do Lançamento Único
        form.setValue("entryFrequency", "single");
        form.setValue("dueDate", entry.dueDate); // O dado já vem convertido do hook
        form.setValue("payNow", entry.status === "paid");
        form.setValue("accountId", entry.accountId || undefined);
        form.setValue("paymentMethodId", entry.paymentMethodId || undefined);
        form.setValue("paymentDate", entry.paymentDate || new Date());
      }
    }
  }, [entryToEdit, isEditing]);

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
      if (isEditing && entryToEdit) {
        await updateFinancialEntry(entryToEdit, data);
        toast({ title: "Sucesso!", description: "Lançamento atualizado." });
      } else {
        await addFinancialEntry(data);
        toast({ title: "Sucesso!", description: "Seu lançamento foi salvo." });
      }

      if (andNew && !isEditing) {
        form.reset(getDefaultValues());
        form.setFocus("description");
      } else {
        router.push("/dashboard");
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
                      key={field.value}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                      disabled={isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
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
                    <Select
                      key={field.value}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              {cat.icon && (
                                <Icon icon={cat.icon} className="h-4 w-4" />
                              )}
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Button
                    type="button"
                    variant="accent-outline"
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
                          value={field.value ?? ""}
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
                <FormItem className="flex flex-row items-center justify-between bg-input rounded-lg border p-4 shadow-sm">
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
                <div className="space-y-4 pt-2">
                  {/* Linha 1: Conta e Meio de Pagamento */}
                  <div className="grid grid-cols-2 gap-4">
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
                  {/* Linha 2: Data do Pagamento */}
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Pagamento</FormLabel>
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
