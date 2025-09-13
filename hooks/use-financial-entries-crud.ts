// in: hooks/use-financial-entries-crud.ts (VERSÃO ATUALIZADA)

import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { endOfYear, differenceInCalendarMonths } from "date-fns";
import { FinancialEntryFormData } from "@/schemas/financial-entry-schema";
import { Account, Category, PaymentMethod } from "@/interfaces/finance";
import { PaymentFormData } from "@/schemas/payment-schema";

export interface FullBackup {
  financialEntries: FinancialEntry[];
  accounts: Account[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

type CreateFinancialEntryData = Omit<
  FinancialEntry,
  "id" | "uid" | "createdAt"
>;

interface UseFinancialEntriesCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useFinancialEntriesCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UseFinancialEntriesCrudProps) => {
  const getCollectionRef = (collectionName: string) => {
    if (!db || !user || !projectId) {
      throw new Error("Firestore não inicializado ou usuário não logado.");
    }
    return collection(
      db,
      `artifacts/${projectId}/users/${user.uid}/${collectionName}`
    );
  };

  const processFinancialEntryPayment = async (
    entryId: string,
    paymentData: PaymentFormData
  ): Promise<boolean> => {
    if (!db) {
      setErrorFinanceData("Firestore não está disponível.");
      return false;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const entryRef = doc(getCollectionRef("financial-entries"), entryId);
        const accountRef = doc(
          getCollectionRef("accounts"),
          paymentData.accountId
        );

        // 1. Pega a versão mais atual da conta antes de modificar
        const accountSnap = await transaction.get(accountRef);
        if (!accountSnap.exists()) throw new Error("Conta não encontrada.");
        const account = accountSnap.data() as Account;

        // 2. Prepara a atualização do Lançamento (super simples agora)
        const updatedEntryData: Partial<FinancialEntry> = {
          status: "paid", // O status é sempre 'paid', sem lógica de parcial.
          paidAmount: paymentData.amount, // Apenas registra o valor que foi pago.
          paymentDate: paymentData.paymentDate,
          accountId: paymentData.accountId,
          paymentMethodId: paymentData.paymentMethodId,
        };

        // 3. Calcula o novo saldo da conta
        const newBalance = (account.balance || 0) - paymentData.amount;

        // 4. Agenda as duas atualizações para acontecerem atomicamente
        transaction.update(entryRef, updatedEntryData);
        transaction.update(accountRef, { balance: newBalance });
      });

      return true;
    } catch (error: unknown) {
      console.error("Erro ao processar pagamento:", error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(`Erro ao processar pagamento: ${error.message}`);
      }
      throw new Error("Erro ao processar pagamento.");
    }
  };

  const addFinancialEntry = async (entryData: CreateFinancialEntryData) => {
    try {
      const collectionRef = getCollectionRef("financial-entries");
      const docRef = await addDoc(collectionRef, {
        ...entryData,
        uid: user!.uid,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error: unknown) {
      console.error("Erro ao adicionar lançamento:", error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(`Erro ao adicionar lançamento: ${error.message}`);
      }
      throw new Error("Erro ao adicionar lançamento:");
    }
  };

  const addInstallmentEntry = async (entryData: FinancialEntryFormData) => {
    try {
      const dbInstance = db;
      if (!dbInstance)
        throw new Error("Instância do Firestore não disponível.");
      const collectionRef = getCollectionRef("financial-entries");
      const batch = writeBatch(dbInstance);
      const recurrenceId = doc(collectionRef).id;
      for (let i = 1; i <= entryData.totalInstallments!; i++) {
        const installmentDocRef = doc(collectionRef);
        const nextDueDate = new Date(entryData.dueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + (i - 1));
        const newEntry: Omit<FinancialEntry, "id"> = {
          description: entryData.description,
          notes: entryData.notes,
          type: entryData.type,
          status: "pending",
          expectedAmount: entryData.expectedAmount,
          dueDate: nextDueDate,
          paidAmount: null,
          paymentDate: null,
          accountId: entryData.accountId || "",
          categoryId: entryData.categoryId,
          recurrenceId,
          installmentNumber: i,
          totalInstallments: entryData.totalInstallments,
          uid: user!.uid,
          createdAt: new Date(),
        };
        batch.set(installmentDocRef, newEntry);
      }
      await batch.commit();
      return true;
    } catch (error: unknown) {
      console.error("Erro ao criar lançamento parcelado:", error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(
          `Erro ao criar lançamento parcelado: ${error.message}`
        );
      }
      throw new Error(
        "Não foi possível criar lançamento parcelado. Tente novamente."
      );
    }
  };

  const addMonthlyRecurringEntries = async (
    entryData: FinancialEntryFormData
  ) => {
    try {
      const dbInstance = db;
      if (!dbInstance)
        throw new Error("Instância do Firestore não disponível.");
      const collectionRef = getCollectionRef("financial-entries");
      const batch = writeBatch(dbInstance);
      const recurrenceId = doc(collectionRef).id;
      const startDate = new Date(entryData.dueDate);
      const yearEnd = endOfYear(startDate);
      const monthsLeft = differenceInCalendarMonths(yearEnd, startDate) + 1;
      for (let i = 0; i < monthsLeft; i++) {
        const installmentDocRef = doc(collectionRef);
        const nextDueDate = new Date(startDate);
        nextDueDate.setMonth(startDate.getMonth() + i);
        const newEntry: Omit<FinancialEntry, "id"> = {
          description: entryData.description,
          notes: entryData.notes,
          type: entryData.type,
          status: "pending",
          expectedAmount: entryData.expectedAmount,
          dueDate: nextDueDate,
          paidAmount: null,
          paymentDate: null,
          accountId: entryData.accountId || "",
          categoryId: entryData.categoryId,
          recurrenceId,
          installmentNumber: i + 1,
          totalInstallments: monthsLeft,
          uid: user!.uid,
          createdAt: new Date(),
        };
        batch.set(installmentDocRef, newEntry);
      }
      await batch.commit();
      return true;
    } catch (error: unknown) {
      console.error("Erro ao criar lançamentos recorrentes:", error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(
          `Erro ao criar lançamentos recorrentes: ${error.message}`
        );
      }
      throw new Error(
        "Não foi possível criar lançamentos recorrentes. Tente novamente."
      );
    }
  };

  const updateFinancialEntry = async (
    entryId: string,
    updatedData: Partial<FinancialEntry>
  ) => {
    try {
      const docRef = doc(getCollectionRef("financial-entries"), entryId);
      await updateDoc(docRef, updatedData);
    } catch (error: unknown) {
      console.error("Erro ao atualizar lançamento:", error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(`Erro ao atualizar lançamento: ${error.message}`);
      }
      throw new Error(
        "Não foi possível atualizar o lançamento. Tente novamente."
      );
    }
  };

  const deleteFinancialEntry = async (entryId: string) => {
    try {
      const docRef = doc(getCollectionRef("financial-entries"), entryId);
      await deleteDoc(docRef);
    } catch (error: unknown) {
      console.error("Erro ao deletar lançamento:", error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(`Erro ao deletar lançamento: ${error.message}`);
      }
      throw new Error(
        "Não foi possível remover a lançamento. Tente novamente."
      );
    }
  };

  const exportUserData = async (): Promise<FullBackup> => {
    if (!db || !user || !projectId) {
      throw new Error("Não é possível exportar: Firestore não inicializado.");
    }
    console.log(`Iniciando exportação para o projeto ${projectId}...`);
    const [accountsSnap, categoriesSnap, paymentMethodsSnap, entriesSnap] =
      await Promise.all([
        getDocs(getCollectionRef("accounts")),
        getDocs(getCollectionRef("categories")),
        getDocs(getCollectionRef("paymentMethods")),
        getDocs(getCollectionRef("financial-entries")),
      ]);
    const fullBackup: FullBackup = {
      accounts: accountsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Account)
      ),
      categories: categoriesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Category)
      ),
      paymentMethods: paymentMethodsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as PaymentMethod)
      ),
      financialEntries: entriesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as FinancialEntry)
      ),
    };
    console.log("Exportação concluída.");
    return fullBackup;
  };

  const importUserData = async (
    backupData: FullBackup,
    onProgress: (message: string) => void
  ) => {
    if (!db || !user || !projectId) {
      throw new Error("Não é possível importar: Firestore não inicializado.");
    }
    onProgress("Iniciando limpeza de dados antigos...");
    const collectionsToWipe = [
      "accounts",
      "categories",
      "paymentMethods",
      "financial-entries",
    ];
    for (const coll of collectionsToWipe) {
      onProgress(`Limpando ${coll}...`);
      const snapshot = await getDocs(getCollectionRef(coll));
      if (snapshot.empty) continue;
      const wipeBatch = writeBatch(db);
      snapshot.docs.forEach((doc) => wipeBatch.delete(doc.ref));
      await wipeBatch.commit();
    }
    onProgress("Limpeza de dados concluída.");
    onProgress("Iniciando importação dos novos dados...");
    const importBatch = writeBatch(db);
    const processCollection = (
      collectionName: keyof FullBackup,
      collectionPath: string
    ) => {
      const items = backupData[collectionName] as any[];
      if (items && items.length > 0) {
        onProgress(`Importando ${items.length} ${collectionName}...`);
        items.forEach((item) => {
          const docRef = doc(getCollectionRef(collectionPath), item.id);
          const newItemData = { ...item, uid: user.uid };
          importBatch.set(docRef, newItemData);
        });
      }
    };
    processCollection("accounts", "accounts");
    processCollection("categories", "categories");
    processCollection("paymentMethods", "paymentMethods");
    processCollection("financialEntries", "financial-entries");
    onProgress("Salvando tudo no banco de dados...");
    await importBatch.commit();
    onProgress("Importação concluída com sucesso!");
  };

  return {
    addFinancialEntry,
    addInstallmentEntry,
    addMonthlyRecurringEntries,
    updateFinancialEntry,
    deleteFinancialEntry,
    processFinancialEntryPayment,
    exportUserData,
    importUserData,
  };
};
