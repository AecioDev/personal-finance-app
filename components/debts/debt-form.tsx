"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { useFinance } from "@/components/providers/finance-provider";
import { DebtFormData, debtSchema } from "@/schemas/debt-schema";
import { Debt } from "@/interfaces/finance";
import { DatePicker } from "../ui/date-picker";
import { CurrencyInput } from "../ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Icon } from "@iconify/react";
import { CategoryManagerDialog } from "../categories/category-manager-dialog";

interface DebtFormProps {
  debtId?: string;
}

export function DebtForm({ debtId }: DebtFormProps) {
  const router = useRouter();
  const { debts, categories, addDebt, updateDebt, loadingFinanceData } =
    useFinance();
  const { toast } = useToast();
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const formValues = useMemo(() => {
    if (debtId) {
      const existingDebt = debts.find((d) => d.id === debtId);
      if (existingDebt && categories.length > 0) {
        return {
          ...existingDebt,
          startDate: new Date(existingDebt.startDate),
          endDate: existingDebt.endDate ? new Date(existingDebt.endDate) : null,
          categoryId: existingDebt.categoryId || "",
          type: existingDebt.type || "complete",
          interestRate: existingDebt.interestRate || null,
          fineRate: existingDebt.fineRate || null,
        };
      }
      return undefined;
    }

    // --- CORREÇÃO APLICADA AQUI (Criação) ---
    // Adicionados os campos que faltavam para bater com o DebtFormData
    return {
      description: "",
      originalAmount: 0,
      totalRepaymentAmount: 0,
      isRecurring: false,
      totalInstallments: 1,
      expectedInstallmentAmount: 0,
      startDate: new Date(),
      endDate: null,
      categoryId: "",
      type: "complete", // Valor padrão para o tipo
      interestRate: null, // Valor padrão
      fineRate: null, // Valor padrão
    };
  }, [debtId, debts, categories]);

  const formMethods = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    values: formValues,
  });

  const {
    watch,
    setValue,
    formState: { isSubmitting },
  } = formMethods;

  const isRecurring = watch("isRecurring");
  const totalInstallments = watch("totalInstallments");
  const expectedInstallmentAmount = watch("expectedInstallmentAmount");

  useEffect(() => {
    if (!isRecurring && totalInstallments && expectedInstallmentAmount) {
      setValue(
        "totalRepaymentAmount",
        totalInstallments * expectedInstallmentAmount
      );
    } else if (isRecurring) {
      setValue("totalRepaymentAmount", 0);
    }
  }, [totalInstallments, expectedInstallmentAmount, isRecurring, setValue]);

  const onSubmit = async (data: DebtFormData) => {
    try {
      if (debtId) {
        const existingDebt = debts.find((d) => d.id === debtId);
        if (!existingDebt) throw new Error("Dívida não encontrada.");

        const totalPaid = existingDebt.totalPaidOnThisDebt || 0;
        const newOutstandingBalance =
          (data.totalRepaymentAmount || data.originalAmount) - totalPaid;

        await updateDebt(debtId, {
          ...data,
          currentOutstandingBalance: newOutstandingBalance,
        } as Partial<Debt>);
        toast({
          title: "Sucesso",
          description: "Dívida atualizada!",
        });
        // Na edição, não queremos redirecionar, apenas mostrar o toast.
        // O redirecionamento pode ser feito na página que chama o form, se necessário.
      } else {
        const debtDataForApi = {
          ...data,
          type: "complete",
        };
        await addDebt(debtDataForApi);
        toast({
          title: "Sucesso",
          description: "Dívida cadastrada!",
        });
        router.push("/debts");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a dívida.",
        variant: "destructive",
      });
    }
  };

  if (debtId && !formValues) {
    return <div className="p-4 text-center">Carregando dados da dívida...</div>;
  }

  return (
    <>
      <FormProvider {...formMethods}>
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <ButtonBack onClick={() => router.back()} />
            <h1 className="text-2xl font-bold text-center mx-4">
              {debtId ? "Editar Dívida" : "Nova Dívida"}
            </h1>
            <div className="w-10 h-10"></div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Dívida</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...formMethods}>
                <form
                  onSubmit={formMethods.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={formMethods.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Financiamento do Carro"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
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
                    control={formMethods.control}
                    name="originalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Original</FormLabel>
                        <FormControl>
                          <CurrencyInput {...field} value={field.value || 0} />
                        </FormControl>
                        <FormDescription>
                          O valor que entrou na sua conta ou o valor total do
                          bem.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Dívida Recorrente</FormLabel>
                      </FormItem>
                    )}
                  />

                  {!isRecurring && (
                    <div className="space-y-6 p-4 border rounded-md">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={formMethods.control}
                          name="totalInstallments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total de Parcelas</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={formMethods.control}
                          name="expectedInstallmentAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor da Parcela</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  value={field.value || 0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={formMethods.control}
                        name="totalRepaymentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Valor Total a Pagar (calculado)
                            </FormLabel>
                            <FormControl>
                              <CurrencyInput
                                {...field}
                                value={field.value || 0}
                                readOnly
                                className="bg-muted/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={formMethods.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início / 1º Vencimento</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value || undefined}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={formMethods.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término (Opcional)</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value || undefined}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || loadingFinanceData}
                  >
                    {isSubmitting ? "Salvando..." : "Salvar Dívida"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </FormProvider>
      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />
    </>
  );
}
