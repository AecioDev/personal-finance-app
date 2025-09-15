// in: hooks/use-financial-entries-crud.ts (VERSÃO CORRIGIDA E UNIFICADA)

import {
  Firestore,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import {
  FinancialEntry,
  FinancialRecurrence,
} from "@/interfaces/financial-entry";
import { addMonths, addWeeks, addYears } from "date-fns";
import { FinancialEntryFormData } from "@/schemas/financial-entry-schema";
import { Account, Category, PaymentMethod } from "@/interfaces/finance";
import { PaymentFormData } from "@/schemas/payment-schema";

// Interfaces e Funções de conversão (mantidas do seu arquivo original)
export interface FullBackup {
  financialEntries: FinancialEntry[];
  accounts: Account[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

const convertDataForExport = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(convertDataForExport);
  }
  if (typeof data === "object") {
    if (
      data &&
      typeof data.seconds === "number" &&
      typeof data.nanoseconds === "number"
    ) {
      const date = new Date(data.seconds * 1000 + data.nanoseconds / 1000000);
      return date.toISOString();
    }
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = convertDataForExport(data[key]);
    }
    return newData;
  }
  return data;
};

const convertDataForImport = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(convertDataForImport);
  }
  if (typeof data === "object") {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = convertDataForImport(data[key]);
    }
    return newData;
  }
  if (
    typeof data === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)
  ) {
    return new Date(data);
  }
  return data;
};

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
  // getCollectionRef MANTIDO EXATAMENTE COMO VOCÊ PEDIU
  const getCollectionRef = (collectionName: string) => {
    if (!db || !user || !projectId) {
      throw new Error("Firestore não inicializado ou usuário não logado.");
    }
    return collection(
      db,
      `artifacts/${projectId}/users/${user.uid}/${collectionName}`
    );
  };

  // --- NOVA LÓGICA PARA LANÇAMENTOS ÚNICOS (DIRETOS) ---
  const addSingleFinancialEntry = async (data: FinancialEntryFormData) => {
    if (data.entryFrequency !== "single" || !data.dueDate || !db || !user)
      return;

    const newEntryData = {
      uid: user.uid,
      description: data.description,
      expectedAmount: data.expectedAmount,
      type: data.type,
      categoryId: data.categoryId,
      notes: data.notes || "",
      dueDate: data.dueDate,
      status: data.payNow ? "paid" : "pending",
      paidAmount: data.payNow ? data.expectedAmount : null,
      paymentDate: data.payNow ? new Date() : null,
      accountId: data.payNow ? data.accountId : null,
      paymentMethodId: data.payNow ? data.paymentMethodId : null,
      createdAt: serverTimestamp(),
      isRecurrence: false,
    };

    const docRef = doc(getCollectionRef("financial-entries"));
    await runTransaction(db, async (transaction) => {
      transaction.set(docRef, { ...newEntryData, id: docRef.id });
      if (data.payNow && data.accountId) {
        const accountRef = doc(getCollectionRef("accounts"), data.accountId);
        const accountDoc = await transaction.get(accountRef);
        if (accountDoc.exists()) {
          const currentBalance = accountDoc.data().balance || 0;
          const newBalance =
            data.type === "income"
              ? currentBalance + data.expectedAmount
              : currentBalance - data.expectedAmount;
          transaction.update(accountRef, { balance: newBalance });
        }
      }
    });
  };

  // --- NOVA LÓGICA PARA RECORRÊNCIAS E PARCELAMENTOS ---
  const addRecurrence = async (data: FinancialEntryFormData) => {
    if (data.entryFrequency === "single" || !data.startDate || !db || !user)
      return;

    const batch = writeBatch(db);
    const recurrenceRef = doc(getCollectionRef("financial-recurrences"));

    const isInstallment = data.entryFrequency === "installment";
    const totalOccurrences = isInstallment ? data.totalInstallments : undefined;

    const ruleData: Omit<FinancialRecurrence, "id"> = {
      uid: user.uid,
      description: data.description,
      expectedAmount: data.expectedAmount,
      type: data.type,
      categoryId: data.categoryId,
      notes: data.notes || "",
      frequency: data.entryFrequency,
      startDate: data.startDate,
      totalOccurrences: totalOccurrences,
      isActive: true,
      createdAt: new Date(),
    };
    batch.set(recurrenceRef, { ...ruleData, id: recurrenceRef.id });

    const totalToGenerate = totalOccurrences || 12;
    let currentDate = data.startDate;

    for (let i = 1; i <= totalToGenerate; i++) {
      if (i > 1) {
        switch (data.entryFrequency) {
          case "weekly":
            currentDate = addWeeks(currentDate, 1);
            break;
          case "installment":
          case "monthly":
            currentDate = addMonths(currentDate, 1);
            break;
          case "yearly":
            currentDate = addYears(currentDate, 1);
            break;
        }
      }

      const newEntryRef = doc(getCollectionRef("financial-entries"));
      const entry: Omit<FinancialEntry, "id"> = {
        uid: user.uid,
        description: data.description,
        expectedAmount: data.expectedAmount,
        type: data.type,
        categoryId: data.categoryId,
        notes: data.notes || "",
        dueDate: currentDate,
        status: "pending",
        paidAmount: null,
        paymentDate: null,
        createdAt: new Date(),
        recurrenceId: recurrenceRef.id,
        installmentNumber: i,
        totalInstallments: totalOccurrences || 0,
      };
      batch.set(newEntryRef, { ...entry, id: newEntryRef.id });
    }
    await batch.commit();
  };

  // --- NOVA FUNÇÃO PRINCIPAL QUE O FORMULÁRIO USA ---
  const addFinancialEntry = async (data: FinancialEntryFormData) => {
    try {
      if (data.entryFrequency === "single") {
        await addSingleFinancialEntry(data);
      } else {
        await addRecurrence(data);
      }
    } catch (error: unknown) {
      console.error("Erro ao adicionar lançamento:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      setErrorFinanceData(`Erro ao adicionar lançamento: ${errorMessage}`);
      throw new Error(`Erro ao adicionar lançamento: ${errorMessage}`);
    }
  };

  // --- DEMAIS FUNÇÕES DO SEU ARQUIVO ORIGINAL, MANTIDAS COMO ESTAVAM ---

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

        const [entrySnap, accountSnap] = await Promise.all([
          transaction.get(entryRef),
          transaction.get(accountRef),
        ]);

        if (!entrySnap.exists()) throw new Error("Lançamento não encontrado.");
        if (!accountSnap.exists()) throw new Error("Conta não encontrada.");

        const entry = entrySnap.data() as FinancialEntry;
        const account = accountSnap.data() as Account;

        const updatedEntryData: Partial<FinancialEntry> = {
          status: "paid",
          paidAmount: paymentData.amount,
          paymentDate: paymentData.paymentDate,
          accountId: paymentData.accountId,
          paymentMethodId: paymentData.paymentMethodId,
        };

        let newBalance = account.balance || 0;
        if (entry.type === "income") {
          newBalance += paymentData.amount;
        } else {
          newBalance -= paymentData.amount;
        }

        transaction.update(entryRef, updatedEntryData);
        transaction.update(accountRef, { balance: newBalance });
      });

      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Erro ao processar pagamento:", error);
      setErrorFinanceData(`Erro ao processar pagamento: ${errorMessage}`);
      throw new Error("Erro ao processar pagamento.");
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

    // Primeiro, pegamos os dados brutos
    const rawBackup: FullBackup = {
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

    // Faz a conversão de datas
    const fullBackup = convertDataForExport(rawBackup);

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

    // Converte as datas para importar.
    const dataToImport = convertDataForImport(backupData);

    const importBatch = writeBatch(db);
    const processCollection = (
      collectionName: keyof FullBackup,
      collectionPath: string
    ) => {
      const items = dataToImport[collectionName] as any[];
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
    // EXPORTANDO A NOVA FUNÇÃO PRINCIPAL
    addFinancialEntry,
    // EXPORTANDO AS FUNÇÕES ANTIGAS QUE FORAM MANTIDAS
    updateFinancialEntry,
    deleteFinancialEntry,
    processFinancialEntryPayment,
    exportUserData,
    importUserData,
    // As funções antigas de add foram removidas
  };
};
