// in: src/utils/migration.ts

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { Debt, DebtInstallment } from "@/interfaces/finance"; // Ajuste o caminho se necessário
import type { FinancialEntry } from "@/interfaces/financial-entry"; // Ajuste o caminho se necessário

/**
 * Lê todos os dados antigos de Dívidas e Parcelas de um usuário
 * e os transforma em uma lista de Lançamentos Financeiros (FinancialEntry).
 *
 * @param db A instância do Firestore.
 * @param uid O ID do usuário cujos dados serão exportados.
 * @returns Uma promessa que resolve para um array de FinancialEntry.
 */
export const exportOldDataAsFinancialEntries = async (
  db: Firestore,
  uid: string
): Promise<FinancialEntry[]> => {
  console.log("Iniciando exportação de dados antigos...");

  // 1. Buscar todas as dívidas (Debts) do usuário.
  const debtsRef = collection(
    db,
    "artifacts",
    "personal-finance-88fe2",
    "users",
    uid,
    "debts"
  );
  const debtsQuery = query(debtsRef);
  const debtsSnapshot = await getDocs(debtsQuery);
  const debts = debtsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Debt[];

  const allFinancialEntries: FinancialEntry[] = [];
  console.log(`Encontradas ${debts.length} dívidas. Processando parcelas...`);

  // 2. Para cada dívida, buscar suas parcelas (DebtInstallments).
  for (const debt of debts) {
    const installmentsRef = collection(
      db,
      "artifacts",
      "personal-finance-88fe2",
      "users",
      uid,
      "debts",
      debt.id,
      "debt-installments"
    );
    const installmentsSnapshot = await getDocs(installmentsRef);
    const installments = installmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DebtInstallment[];

    // 3. Mapear cada Parcela para um Lançamento Financeiro.
    for (const installment of installments) {
      // Lógica de mapeamento (o "de-para")
      const financialEntry: FinancialEntry = {
        id: installment.id, // Mantemos o ID original da parcela para rastreabilidade
        uid: installment.uid,
        description: `${debt.description} (${installment.installmentNumber}/${debt.totalInstallments})`,
        notes: "Dado migrado da estrutura antiga.",
        type: "expense", // Dívidas são sempre despesas

        // Mapeamento de Status
        status:
          installment.status === "paid"
            ? "paid"
            : installment.status === "overdue"
            ? "overdue"
            : "pending",

        expectedAmount: installment.expectedAmount,
        dueDate: (installment.expectedDueDate as any).toDate(), // Convertendo Timestamp para Date

        paidAmount: installment.paidAmount > 0 ? installment.paidAmount : null,
        paymentDate: installment.paymentDate
          ? (installment.paymentDate as any).toDate()
          : null,

        categoryId: debt.categoryId,

        // Campos de recorrência
        recurrenceId: installment.debtId,
        installmentNumber: installment.installmentNumber,
        totalInstallments: debt.totalInstallments || 0,

        createdAt: installment.createdAt
          ? (installment.createdAt as any).toDate()
          : new Date(),
      };

      // ATENÇÃO: accountId e paymentMethodId não estão no modelo antigo.
      // Eles teriam que ser buscados na coleção 'transactions',
      // o que tornaria o script mais complexo. Por enquanto, ficam de fora.

      allFinancialEntries.push(financialEntry);
    }
  }

  console.log(
    `Exportação finalizada. Total de ${allFinancialEntries.length} lançamentos financeiros gerados.`
  );
  return allFinancialEntries;
};

/**
 * Pega um array de dados e dispara o download de um arquivo JSON.
 * @param data O array de dados a ser salvo.
 * @param filename O nome do arquivo JSON.
 */
export const downloadAsJson = (data: any[], filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2); // O '2' formata o JSON para ficar legível
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log(`Arquivo ${filename} gerado para download.`);
};
