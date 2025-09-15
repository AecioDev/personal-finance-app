"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PageViewLayout } from "../layout/page-view-layout";
import { EntryType } from "../../interfaces/financial-entry";
import { useEffect } from "react";
import { FinancialEntryForm } from "./forms/financial-entry-form";

export function FinancialEntryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as EntryType;

  // Se o tipo não for válido, redireciona para o dashboard para evitar erros.
  useEffect(() => {
    if (type !== "income" && type !== "expense") {
      router.replace("/dashboard");
    }
  }, [type, router]);

  if (!type || (type !== "income" && type !== "expense")) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p>Carregando...</p>
      </div>
    );
  }

  const pageTitle = type === "income" ? "Nova Receita" : "Nova Despesa";
  const pageSubtitle =
    type === "income"
      ? "Registre uma nova entrada de dinheiro."
      : "Informe os detalhes da nova conta a pagar.";

  return (
    <PageViewLayout title={pageTitle} subtitle={pageSubtitle}>
      <FinancialEntryForm
        entryType={type}
        onFinished={() => router.back()} // Navega de volta ao finalizar
      />
    </PageViewLayout>
  );
}
