"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageViewLayout } from "@/components/layout/page-view-layout";
import { useFinance } from "@/components/providers/finance-provider";
import {
  FinancialEntry,
  FinancialRecurrence,
} from "@/interfaces/financial-entry";
import { useToast } from "@/components/ui/use-toast";
import { FinancialEntryForm } from "./forms/financial-entry-form";

export function FinancialEntryEditView() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const {
    getRecurrenceRuleById,
    getFinancialEntryById,
    errorFinanceData,
    loadingFinanceData,
  } = useFinance();

  const [itemToEdit, setItemToEdit] = useState<
    FinancialRecurrence | FinancialEntry | null
  >(null);
  const [loading, setLoading] = useState(true);

  const fetchAttempted = useRef(false);
  const entryId = params.id as string;

  // Efeito para observar erros vindos do hook
  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao Carregar",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  useEffect(() => {
    if (!entryId || loadingFinanceData || fetchAttempted.current) return;

    const fetchData = async () => {
      fetchAttempted.current = true;
      setLoading(true);

      const recurrenceRule = await getRecurrenceRuleById(entryId);
      if (recurrenceRule) {
        setItemToEdit(recurrenceRule);
        setLoading(false);
        return;
      }

      const singleEntry = await getFinancialEntryById(entryId);
      if (singleEntry) {
        setItemToEdit(singleEntry);
        setLoading(false);
        return;
      }

      toast({
        title: "Lançamento não encontrado",
        description: "Você será redirecionado para o dashboard.",
        variant: "destructive",
      });
      router.replace("/dashboard");
    };

    fetchData();
  }, [
    entryId,
    loadingFinanceData,
    getRecurrenceRuleById,
    getFinancialEntryById,
    router,
    toast,
  ]);

  if (loading || !itemToEdit) {
    return (
      <PageViewLayout title="Editar Lançamento">
        <div className="flex items-center justify-center pt-8">
          <p className="text-muted-foreground">
            Carregando dados para edição...
          </p>
        </div>
      </PageViewLayout>
    );
  }

  const isRecurrence = "frequency" in itemToEdit;

  return (
    <PageViewLayout
      title={
        isRecurrence ? "Editar Lançamento Recorrente" : "Editar Lançamento"
      }
      subtitle={`Ajuste os detalhes de "${itemToEdit.description}"`}
    >
      <FinancialEntryForm
        entryType={itemToEdit.type}
        entryToEdit={itemToEdit}
        onFinished={() => router.back()}
      />
    </PageViewLayout>
  );
}
