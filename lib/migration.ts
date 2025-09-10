// in: src/utils/migration.ts (VERSÃO CORRIGIDA)

import { collection, getDocs, query, type Firestore } from "firebase/firestore";
import type { Debt, DebtInstallment } from "@/interfaces/finance"; // Ajuste o caminho se necessário
import type { FinancialEntry } from "@/interfaces/financial-entry"; // Ajuste o caminho se necessário

export const exportOldDataAsFinancialEntries = async (
  db: Firestore,
  uid: string
): Promise<FinancialEntry[]> => {
  console.log("Iniciando exportação de dados antigos (v2)...");

  // O caminho base para as coleções do usuário
  const userBasePath = `artifacts/personal-finance-88fe2/users/${uid}`;

  // 1. Buscar todas as dívidas (Debts) e colocar num Map para acesso rápido.
  // Isso evita que a gente precise consultar o banco para cada parcela.
  const debtsRef = collection(db, `${userBasePath}/debts`);
  const debtsSnapshot = await getDocs(debtsRef);
  const debtsMap = new Map<string, Debt>();
  debtsSnapshot.docs.forEach((doc) => {
    debtsMap.set(doc.id, { id: doc.id, ...doc.data() } as Debt);
  });
  console.log(`Encontradas ${debtsMap.size} dívidas no Map.`);

  // 2. Buscar TODAS as parcelas (DebtInstallments) do usuário de uma vez só.
  // Note que agora estamos buscando na coleção principal "debtInstallments".
  const installmentsRef = collection(db, `${userBasePath}/debtInstallments`);
  const installmentsSnapshot = await getDocs(installmentsRef);
  const allInstallments = installmentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DebtInstallment[];
  console.log(`Encontradas ${allInstallments.length} parcelas no total.`);

  const allFinancialEntries: FinancialEntry[] = [];

  // 3. Mapear as parcelas, buscando a dívida "mãe" no Map.
  for (const installment of allInstallments) {
    const parentDebt = debtsMap.get(installment.debtId);

    // Se a parcela não tiver uma dívida mãe correspondente, pulamos ela.
    if (!parentDebt) {
      console.warn(
        `Parcela ${installment.id} sem dívida mãe correspondente (debtId: ${installment.debtId}). Pulando.`
      );
      continue;
    }

    // Lógica de mapeamento (o "de-para") - continua a mesma
    const financialEntry: FinancialEntry = {
      id: installment.id,
      uid: installment.uid,
      description: `${parentDebt.description} (${installment.installmentNumber}/${parentDebt.totalInstallments})`,
      notes: "Dado migrado da estrutura antiga.",
      type: "expense",
      status:
        installment.status === "paid"
          ? "paid"
          : installment.status === "overdue"
          ? "overdue"
          : "pending",
      expectedAmount: installment.expectedAmount,
      dueDate: (installment.expectedDueDate as any).toDate(),
      paidAmount: installment.paidAmount > 0 ? installment.paidAmount : null,
      paymentDate: installment.paymentDate
        ? (installment.paymentDate as any).toDate()
        : null,
      categoryId: parentDebt.categoryId,
      recurrenceId: installment.debtId,
      installmentNumber: installment.installmentNumber,
      totalInstallments: parentDebt.totalInstallments || 0,
      createdAt: installment.createdAt
        ? (installment.createdAt as any).toDate()
        : new Date(),
    };

    allFinancialEntries.push(financialEntry);
  }

  console.log(
    `Exportação finalizada. Total de ${allFinancialEntries.length} lançamentos financeiros gerados.`
  );
  return allFinancialEntries;
};

// A função downloadAsJson continua a mesma, não precisa alterar.
export const downloadAsJson = (data: any[], filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
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
