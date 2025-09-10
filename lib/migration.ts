// in: src/utils/migration.ts (VERSÃO FINAL E COMPLETA)

import { collection, getDocs, query, type Firestore } from "firebase/firestore";
import type {
  Account,
  Category,
  Debt,
  DebtInstallment,
  PaymentMethod,
  Transaction,
} from "@/interfaces/finance"; // Ajuste o caminho
import type { FinancialEntry } from "@/interfaces/financial-entry"; // Ajuste o caminho

// Nova interface para o nosso arquivo de backup completo
export interface FullBackup {
  financialEntries: FinancialEntry[];
  accounts: Account[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

/**
 * Lê todos os dados antigos de um usuário (Dívidas, Parcelas, Transações, Contas, etc.)
 * e os transforma em um único objeto de backup com a nova estrutura.
 *
 * @param db A instância do Firestore.
 * @param uid O ID do usuário cujos dados serão exportados.
 * @returns Uma promessa que resolve para um objeto FullBackup.
 */
export const exportFullUserData = async (
  db: Firestore,
  uid: string
): Promise<FullBackup> => {
  console.log("Iniciando exportação completa de dados (v3)...");
  const userBasePath = `artifacts/personal-finance-88fe2/users/${uid}`;

  // 1. Buscar todas as coleções em paralelo para máxima eficiência
  const [
    debtsSnap,
    installmentsSnap,
    transactionsSnap,
    accountsSnap,
    categoriesSnap,
    paymentMethodsSnap,
  ] = await Promise.all([
    getDocs(collection(db, `${userBasePath}/debts`)),
    getDocs(collection(db, `${userBasePath}/debtInstallments`)),
    getDocs(collection(db, `${userBasePath}/transactions`)),
    getDocs(collection(db, `${userBasePath}/accounts`)),
    getDocs(collection(db, `${userBasePath}/categories`)),
    getDocs(collection(db, `${userBasePath}/paymentMethods`)),
  ]);

  // 2. Mapear tudo para acesso rápido
  const debtsMap = new Map<string, Debt>();
  debtsSnap.docs.forEach((doc) =>
    debtsMap.set(doc.id, { id: doc.id, ...doc.data() } as Debt)
  );

  const transactionsMap = new Map<string, Transaction>();
  transactionsSnap.docs.forEach((doc) =>
    transactionsMap.set(doc.id, { id: doc.id, ...doc.data() } as Transaction)
  );

  const allInstallments = installmentsSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as DebtInstallment)
  );

  console.log(
    `Dados carregados: ${debtsMap.size} dívidas, ${transactionsMap.size} transações, ${allInstallments.length} parcelas.`
  );

  // 3. Processar e "costurar" os dados para criar os Financial Entries
  const financialEntries: FinancialEntry[] = [];
  for (const installment of allInstallments) {
    const parentDebt = debtsMap.get(installment.debtId);
    if (!parentDebt) continue;

    let accountId: string | undefined = undefined;
    let paymentMethodId: string | undefined | null = undefined;

    // Se a parcela tem transações, busca a primeira para pegar os IDs
    if (installment.transactionIds && installment.transactionIds.length > 0) {
      const firstTransactionId = installment.transactionIds[0];
      const linkedTransaction = transactionsMap.get(firstTransactionId);
      if (linkedTransaction) {
        accountId = linkedTransaction.accountId;
        paymentMethodId = linkedTransaction.paymentMethodId;
      }
    }

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
      // Dados "enriquecidos" a partir da transação!
      accountId: accountId,
      paymentMethodId: paymentMethodId,
    };
    financialEntries.push(financialEntry);
  }

  // 4. Preparar o objeto final do backup
  const fullBackup: FullBackup = {
    financialEntries: financialEntries,
    accounts: accountsSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Account)
    ),
    categories: categoriesSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Category)
    ),
    paymentMethods: paymentMethodsSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PaymentMethod)
    ),
  };

  console.log(
    `Exportação finalizada. Backup contém ${financialEntries.length} lançamentos, ${fullBackup.accounts.length} contas, ${fullBackup.categories.length} categorias, e ${fullBackup.paymentMethods.length} formas de pagamento.`
  );
  return fullBackup;
};

// A função downloadAsJson continua a mesma, não precisa alterar.
export const downloadAsJson = (data: any, filename: string) => {
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
