// in: hooks/use-financial-entries-crud.ts (VERSÃO CORRIGIDA E COMPLETA)

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
  query,
  where,
  getDoc,
  Timestamp,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import {
  FinancialEntry,
  FinancialRecurrence,
} from "@/interfaces/financial-entry";
import { addMonths, addWeeks, addYears, isPast, isToday } from "date-fns";
import { FinancialEntryFormData } from "@/schemas/financial-entry-schema";
import { Account, Category, PaymentMethod } from "@/interfaces/finance";
import { PaymentFormData } from "@/schemas/payment-schema";
import { useCallback } from "react";
import { TransferFormData } from "@/schemas/transfer-schema";

export interface FullBackup {
  financialEntries: FinancialEntry[];
  financialRecurrences: FinancialRecurrence[];
  accounts: Account[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

// ... Funções helpers ...
const convertDocToData = <T extends Record<string, any>>(
  docSnap: DocumentSnapshot<DocumentData>
): T => {
  if (!docSnap.exists()) {
    throw new Error("Document does not exist");
  }

  const data = docSnap.data();
  const convertedData: Record<string, any> = {};

  for (const key in data) {
    const value = data[key];
    if (value instanceof Timestamp) {
      convertedData[key] = value.toDate();
    } else {
      convertedData[key] = value;
    }
  }

  return { id: docSnap.id, ...convertedData } as unknown as T;
};

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
  const getCollectionRef = useCallback(
    (collectionName: string) => {
      if (!db || !user || !projectId) {
        throw new Error("Firestore não inicializado ou usuário não logado.");
      }
      return collection(
        db,
        `artifacts/${projectId}/users/${user.uid}/${collectionName}`
      );
    },
    [db, user, projectId]
  );

  const getDocRef = useCallback(
    (collectionName: string, id: string) => {
      if (!db || !user || !projectId) {
        throw new Error("Firestore não inicializado ou usuário não logado.");
      }
      return doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/${collectionName}`,
        id
      );
    },
    [db, user, projectId]
  );

  const addSingleFinancialEntry = useCallback(
    async (data: FinancialEntryFormData) => {
      if (data.entryFrequency !== "single" || !data.dueDate || !db || !user)
        return;

      const dataPagamento = data.paymentDate ? data.paymentDate : new Date();
      const newEntryData: Omit<FinancialEntry, "id" | "createdAt"> = {
        uid: user.uid,
        description: data.description,
        expectedAmount: data.expectedAmount,
        type: data.type,
        categoryId: data.categoryId,
        notes: data.notes || "",
        dueDate: data.dueDate,
        status: data.payNow ? "paid" : "pending",
        paidAmount: data.payNow ? data.expectedAmount : null,
        paymentDate: data.payNow ? dataPagamento : null,
        accountId: data.payNow ? data.accountId : "",
        paymentMethodId: data.payNow ? data.paymentMethodId : null,
      };

      const entryDocRef = doc(getCollectionRef("financial-entries"));

      await runTransaction(db, async (transaction) => {
        let newBalance: number | undefined;
        const accountRef =
          data.payNow && data.accountId
            ? getDocRef("accounts", data.accountId)
            : null;

        // Se for um pagamento imediato, primeiro lemos o saldo da conta.
        if (accountRef) {
          const accountDoc = await transaction.get(accountRef);
          if (!accountDoc.exists()) {
            throw new Error(
              "A conta selecionada para o pagamento não foi encontrada."
            );
          }
          const currentBalance = accountDoc.data().balance || 0;
          newBalance =
            data.type === "income"
              ? currentBalance + data.expectedAmount
              : currentBalance - data.expectedAmount;
        }

        // Agora, com todas as leituras feitas, podemos escrever no banco.
        transaction.set(entryDocRef, {
          ...newEntryData,
          id: entryDocRef.id,
          createdAt: serverTimestamp(),
        });

        if (accountRef && newBalance !== undefined) {
          transaction.update(accountRef, { balance: newBalance });
        }
      });
    },
    [db, user, getCollectionRef, getDocRef]
  );

  const addRecurrence = useCallback(
    async (data: FinancialEntryFormData) => {
      if (data.entryFrequency === "single" || !data.startDate || !db || !user)
        return;

      const batch = writeBatch(db);
      const recurrenceRef = doc(getCollectionRef("financial-recurrences"));

      const isInstallment = data.entryFrequency === "installment";
      const totalOccurrences = isInstallment ? data.totalInstallments : null;

      const ruleData: Omit<FinancialRecurrence, "id"> = {
        uid: user.uid,
        description: data.description,
        expectedAmount: data.expectedAmount,
        type: data.type,
        categoryId: data.categoryId || "",
        notes: data.notes || "",
        frequency: data.entryFrequency,
        startDate: data.startDate,
        totalOccurrences: totalOccurrences || 0,
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
        const entry: Omit<FinancialEntry, "id" | "createdAt"> = {
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
          recurrenceId: recurrenceRef.id,
          installmentNumber: i,
          totalInstallments: totalOccurrences || 0,
        };
        batch.set(newEntryRef, {
          ...entry,
          id: newEntryRef.id,
          createdAt: new Date(),
        });
      }
      await batch.commit();
    },
    [db, user, getCollectionRef]
  );

  const addFinancialEntry = useCallback(
    async (data: FinancialEntryFormData) => {
      try {
        if (data.entryFrequency === "single") {
          await addSingleFinancialEntry(data);
        } else {
          await addRecurrence(data);
        }
      } catch (error: unknown) {
        console.error("Erro ao adicionar lançamento:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido";

        throw new Error(`Erro ao adicionar lançamento: ${errorMessage}`);
      }
    },
    [addSingleFinancialEntry, addRecurrence]
  );

  const updateSingleFinancialEntry = useCallback(
    async (id: string, data: FinancialEntryFormData) => {
      if (data.entryFrequency !== "single" || !data.dueDate) return;
      const entryRef = getDocRef("financial-entries", id);
      const updatedData = {
        description: data.description,
        expectedAmount: data.expectedAmount,
        categoryId: data.categoryId,
        notes: data.notes || "",
        dueDate: data.dueDate,
      };
      await updateDoc(entryRef, updatedData);
    },
    [getDocRef]
  );

  const updateRecurrenceRuleAndFutureEntries = useCallback(
    async (rule: FinancialRecurrence, data: FinancialEntryFormData) => {
      if (data.entryFrequency === "single" || !db) return;

      const batch = writeBatch(db);
      const ruleRef = getDocRef("financial-recurrences", rule.id);
      const updatedRuleData = {
        description: data.description,
        expectedAmount: data.expectedAmount,
        categoryId: data.categoryId,
        notes: data.notes || "",
      };
      batch.update(ruleRef, updatedRuleData);

      const entriesQuery = query(
        getCollectionRef("financial-entries"),
        where("recurrenceId", "==", rule.id),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(entriesQuery);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          description: data.description,
          expectedAmount: data.expectedAmount,
          categoryId: data.categoryId,
          notes: data.notes || "",
        });
      });

      await batch.commit();
    },
    [db, getDocRef, getCollectionRef]
  );

  const updateFinancialEntry = useCallback(
    async (
      itemToEdit: FinancialRecurrence | FinancialEntry,
      data: FinancialEntryFormData
    ) => {
      try {
        const isRecurrenceRule = "frequency" in itemToEdit;
        if (isRecurrenceRule) {
          await updateRecurrenceRuleAndFutureEntries(itemToEdit, data);
        } else {
          await updateSingleFinancialEntry(itemToEdit.id, data);
        }
      } catch (error: unknown) {
        console.error("Erro ao atualizar lançamento:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido";
        setErrorFinanceData(`Erro ao atualizar lançamento: ${errorMessage}`);
        throw new Error(`Erro ao atualizar lançamento: ${errorMessage}`);
      }
    },
    [
      setErrorFinanceData,
      updateRecurrenceRuleAndFutureEntries,
      updateSingleFinancialEntry,
    ]
  );

  const getFinancialEntryById = useCallback(
    async (id: string): Promise<FinancialEntry | null> => {
      if (!db || !user?.uid || !projectId) {
        console.error(
          "[HOOK] ERRO FATAL: Contexto do Firebase não está pronto! Abortando busca."
        );
        setErrorFinanceData("Contexto do Firebase não está pronto.");
        return null;
      }
      try {
        const docRef = doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/financial-entries`,
          id
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return convertDocToData<FinancialEntry>(docSnap);
        }
        return null;
      } catch (error) {
        console.error(
          `[HOOK] CRASH na busca por FinancialEntry ID "${id}":`,
          error
        );
        setErrorFinanceData(
          "Não foi possível carregar os dados do lançamento."
        );
        return null;
      }
    },
    [db, user, projectId, setErrorFinanceData]
  );

  const getRecurrenceRuleById = useCallback(
    async (id: string): Promise<FinancialRecurrence | null> => {
      if (!db || !user?.uid || !projectId) {
        console.error(
          "[HOOK] ERRO FATAL: Contexto do Firebase não está pronto! Abortando busca."
        );
        setErrorFinanceData("Contexto do Firebase não está pronto.");
        return null;
      }
      try {
        const docRef = doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/financial-recurrences`,
          id
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return convertDocToData<FinancialRecurrence>(docSnap);
        }
        return null;
      } catch (error) {
        console.error(
          `[HOOK] CRASH na busca por RecurrenceRule ID "${id}":`,
          error
        );
        setErrorFinanceData(
          "Não foi possível carregar a regra de recorrência."
        );
        return null;
      }
    },
    [db, user, projectId, setErrorFinanceData]
  );

  const deleteTransfer = useCallback(
    async (transferId: string) => {
      if (!db) throw new Error("Banco de dados não inicializado.");

      // 1. Encontrar as duas "pernas" da transferência
      const q = query(
        getCollectionRef("financial-entries"),
        where("transferId", "==", transferId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length !== 2) {
        throw new Error("Transferência inválida ou não encontrada.");
      }

      const entryA = querySnapshot.docs[0].data() as FinancialEntry;
      const entryB = querySnapshot.docs[1].data() as FinancialEntry;

      const expenseEntry = entryA.type === "expense" ? entryA : entryB;
      const incomeEntry = entryA.type === "income" ? entryA : entryB;

      if (!expenseEntry.accountId || !incomeEntry.accountId) {
        throw new Error("Contas da transferência não encontradas.");
      }

      const sourceAccountRef = getDocRef("accounts", expenseEntry.accountId);
      const destAccountRef = getDocRef("accounts", incomeEntry.accountId);

      // 2. Executar a exclusão e o estorno dos saldos em uma transação atômica
      await runTransaction(db, async (transaction) => {
        const sourceAccountDoc = await transaction.get(sourceAccountRef);
        const destAccountDoc = await transaction.get(destAccountRef);

        if (!sourceAccountDoc.exists() || !destAccountDoc.exists()) {
          throw new Error(
            "Uma das contas da transferência não foi encontrada."
          );
        }

        const sourceBalance = sourceAccountDoc.data().balance || 0;
        const destBalance = destAccountDoc.data().balance || 0;
        const amount = expenseEntry.paidAmount || 0;

        // Reverte a operação: devolve o dinheiro para a origem e retira do destino
        transaction.update(sourceAccountRef, {
          balance: sourceBalance + amount,
        });
        transaction.update(destAccountRef, { balance: destBalance - amount });

        // Deleta os dois lançamentos
        transaction.delete(querySnapshot.docs[0].ref);
        transaction.delete(querySnapshot.docs[1].ref);
      });
    },
    [db, getCollectionRef, getDocRef]
  );

  const deleteFinancialEntry = useCallback(
    async (
      entryId: string,
      scope: "one" | "future" | "all" = "one" // 'one' é o padrão
    ) => {
      if (!db) throw new Error("Banco de dados não inicializado.");

      const entryRef = getDocRef("financial-entries", entryId);

      // 1. Buscamos o lançamento que o usuário quer deletar
      const entrySnap = await getDoc(entryRef);
      if (!entrySnap.exists()) {
        throw new Error("Lançamento não encontrado para exclusão.");
      }
      const entryData = entrySnap.data() as FinancialEntry;

      if (entryData.isTransfer) {
        throw new Error(
          "Transferências devem ser excluídas através da função deleteTransfer."
        );
      }

      // 2. REGRA DE SEGURANÇA: Bloqueia a exclusão de lançamentos pagos
      if (entryData.status === "paid") {
        throw new Error(
          "Lançamentos pagos devem ser estornados antes de serem excluídos para manter a consistência do saldo."
        );
      }

      // Se o escopo for 'one' ou se o lançamento não for recorrente, deleta apenas ele.
      if (scope === "one" || !entryData.recurrenceId) {
        await deleteDoc(entryRef);
        return;
      }

      // Se for um lançamento recorrente e o escopo for 'future' ou 'all'
      const batch = writeBatch(db);
      const recurrenceId = entryData.recurrenceId;

      if (scope === "future") {
        // Deleta esta e todas as futuras
        const q = query(
          getCollectionRef("financial-entries"),
          where("recurrenceId", "==", recurrenceId),
          where("dueDate", ">=", entryData.dueDate)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => batch.delete(doc.ref));
      } else if (scope === "all") {
        // Deleta a série inteira (lançamentos + a regra)
        const q = query(
          getCollectionRef("financial-entries"),
          where("recurrenceId", "==", recurrenceId)
        );
        const querySnapshot = await getDocs(q);

        // Antes de deletar, vamos verificar se existe algum lançamento pago na série.
        const hasPaidEntries = querySnapshot.docs.some(
          (doc) => (doc.data() as FinancialEntry).status === "paid"
        );

        if (hasPaidEntries) {
          // Se houver, lançamos um erro e abortamos a operação.
          throw new Error(
            "Esta série possui lançamentos que já foram pagos. Por favor, estorne todos os pagamentos antes de excluir a série completa."
          );
        }

        // Se passou na verificação, então podemos deletar tudo.
        querySnapshot.forEach((doc) => batch.delete(doc.ref));

        // Também deleta a regra principal na outra coleção
        const recurrenceRef = getDocRef("financial-recurrences", recurrenceId);
        batch.delete(recurrenceRef);
      }

      await batch.commit();
    },
    [db, getDocRef, getCollectionRef]
  );

  const processFinancialEntryPayment = useCallback(
    async (entryId: string, paymentData: PaymentFormData): Promise<boolean> => {
      if (!db) return false;
      const entryRef = getDocRef("financial-entries", entryId);
      const accountRef = getDocRef("accounts", paymentData.accountId);
      try {
        await runTransaction(db, async (transaction) => {
          const entryDoc = await transaction.get(entryRef);
          const accountDoc = await transaction.get(accountRef);
          if (!entryDoc.exists() || !accountDoc.exists()) {
            throw new Error("Lançamento ou conta não encontrada.");
          }
          const entryData = entryDoc.data() as FinancialEntry;
          const accountData = accountDoc.data() as Account;
          const currentBalance = accountData.balance || 0;
          const newBalance =
            entryData.type === "income"
              ? currentBalance + entryData.expectedAmount
              : currentBalance - entryData.expectedAmount;
          transaction.update(accountRef, { balance: newBalance });
          transaction.update(entryRef, {
            status: "paid",
            paidAmount: entryData.expectedAmount,
            paymentDate: paymentData.paymentDate,
            accountId: paymentData.accountId,
            paymentMethodId: paymentData.paymentMethodId,
          });
        });
        return true;
      } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        setErrorFinanceData("Erro ao processar pagamento.");
        return false;
      }
    },
    [db, getDocRef, setErrorFinanceData]
  );

  const revertFinancialEntryPayment = useCallback(
    async (entry: FinancialEntry) => {
      if (!db) throw new Error("Banco de dados não inicializado.");
      if (entry.status !== "paid" || !entry.accountId || !entry.paidAmount) {
        throw new Error(
          "Este lançamento não é um pagamento válido para ser estornado."
        );
      }

      const entryRef = getDocRef("financial-entries", entry.id);
      const accountRef = getDocRef("accounts", entry.accountId);

      await runTransaction(db, async (transaction) => {
        // LEITURAS PRIMEIRO
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) {
          throw new Error(
            "A conta associada a este pagamento não foi encontrada."
          );
        }

        // CÁLCULOS
        const accountData = accountDoc.data() as Account;
        const currentBalance = accountData.balance || 0;

        // Lógica inversa do pagamento: se era despesa, devolve o dinheiro. Se era receita, retira.
        const revertedBalance =
          entry.type === "expense"
            ? currentBalance + entry.paidAmount!
            : currentBalance - entry.paidAmount!;

        // Determina o novo status: se a data de vencimento já passou, vira 'overdue'
        const newStatus =
          isPast(entry.dueDate) && !isToday(entry.dueDate)
            ? "overdue"
            : "pending";

        // GRAVA
        transaction.update(accountRef, { balance: revertedBalance });
        transaction.update(entryRef, {
          status: newStatus,
          paidAmount: null,
          paymentDate: null,
          accountId: "",
          paymentMethodId: null,
        });
      });
    },
    [db, getDocRef]
  );

  const exportUserData = useCallback(async (): Promise<FullBackup> => {
    const collectionsToExport: (keyof FullBackup)[] = [
      "accounts",
      "categories",
      "paymentMethods",
      "financialEntries",
      "financialRecurrences",
    ];
    const backupData: any = {};
    for (const collectionName of collectionsToExport) {
      const firestoreCollectionName =
        collectionName === "financialEntries"
          ? "financial-entries"
          : collectionName === "financialRecurrences"
          ? "financial-recurrences"
          : collectionName;
      const querySnapshot = await getDocs(
        getCollectionRef(firestoreCollectionName)
      );
      backupData[collectionName] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    return convertDataForExport(backupData) as FullBackup;
  }, [getCollectionRef]);

  const importUserData = useCallback(
    async (backupData: FullBackup, onProgress: (message: string) => void) => {
      if (!db) return;
      onProgress("Iniciando limpeza dos dados existentes...");
      const collectionsToWipe = [
        "financial-entries",
        "financial-recurrences",
        "accounts",
        "categories",
        "paymentMethods",
      ];
      for (const collectionName of collectionsToWipe) {
        const wipeBatch = writeBatch(db);
        const snapshot = await getDocs(getCollectionRef(collectionName));
        snapshot.docs.forEach((doc) => wipeBatch.delete(doc.ref));
        await wipeBatch.commit();
      }
      onProgress("Limpeza concluída. Importando novos dados...");
      const dataToImport = convertDataForImport(backupData);
      const importBatch = writeBatch(db);
      const processCollection = (
        collectionKey: keyof FullBackup,
        collectionPath: string
      ) => {
        const items = dataToImport[collectionKey] as any[];
        if (items && items.length > 0) {
          onProgress(`Importando ${items.length} ${collectionKey}...`);
          items.forEach((item) => {
            const docRef = getDocRef(collectionPath, item.id);
            importBatch.set(docRef, item);
          });
        }
      };
      processCollection("accounts", "accounts");
      processCollection("categories", "categories");
      processCollection("paymentMethods", "paymentMethods");
      processCollection("financialEntries", "financial-entries");
      processCollection("financialRecurrences", "financial-recurrences");
      await importBatch.commit();
      onProgress("Importação concluída com sucesso!");
    },
    [db, getCollectionRef, getDocRef]
  );

  const migrateLegacyRecurrences = useCallback(async () => {
    if (!db || !user) {
      console.error("DB ou Usuário não disponíveis para migração.");
      return;
    }
    console.log("Iniciando migração de dados legados...");

    const entriesRef = getCollectionRef("financial-entries");
    const q = query(entriesRef, where("recurrenceId", "!=", null));
    const querySnapshot = await getDocs(q);

    const legacyEntries = querySnapshot.docs.map(
      (doc) => doc.data() as FinancialEntry
    );
    if (legacyEntries.length === 0) {
      console.log("Nenhum lançamento legado para migrar.");
      alert("Nenhum lançamento legado para migrar.");
      return;
    }

    const groupedByRecurrence = legacyEntries.reduce((acc, entry) => {
      const key = entry.recurrenceId!;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as Record<string, FinancialEntry[]>);

    console.log(
      `Encontrados ${
        Object.keys(groupedByRecurrence).length
      } grupos de recorrência para criar.`
    );

    const batch = writeBatch(db);
    let migratedCount = 0;

    const safeCreateDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;

      if (typeof dateValue.toDate === "function") {
        return dateValue.toDate();
      }

      if (
        typeof dateValue === "object" &&
        dateValue !== null &&
        typeof dateValue.seconds === "number"
      ) {
        const d = new Date(dateValue.seconds * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? null : d;
    };

    for (const recurrenceId in groupedByRecurrence) {
      const validEntriesInGroup = groupedByRecurrence[recurrenceId]
        .map((entry) => ({
          ...entry,
          jsDate: safeCreateDate(entry.dueDate),
        }))
        .filter((entry) => entry.jsDate !== null)
        .sort((a, b) => a.jsDate!.getTime() - b.jsDate!.getTime());

      if (validEntriesInGroup.length === 0) {
        console.warn(
          `[MIGRAÇÃO] Grupo com recurrenceId "${recurrenceId}" foi IGNORADO por não ter lançamentos com datas válidas.`
        );
        continue;
      }

      const firstEntry = validEntriesInGroup[0];

      const newRecurrenceRule: Omit<FinancialRecurrence, "id"> = {
        uid: user.uid,
        description: firstEntry.description,
        expectedAmount: firstEntry.expectedAmount,
        type: firstEntry.type,
        categoryId: firstEntry.categoryId || "",
        notes: firstEntry.notes || "",
        frequency: "installment",
        startDate: firstEntry.jsDate!,
        totalOccurrences: validEntriesInGroup.length,
        isActive: true,
        createdAt: new Date(),
      };

      const docRef = getDocRef("financial-recurrences", recurrenceId);
      batch.set(docRef, { ...newRecurrenceRule, id: recurrenceId });
      migratedCount++;
    }

    if (migratedCount > 0) {
      await batch.commit();
    }

    const message = `Migração concluída! ${migratedCount} de ${
      Object.keys(groupedByRecurrence).length
    } grupos de recorrência foram criados com sucesso. Verifique o console para detalhes.`;
    console.log(message);
    alert(message);
  }, [db, user, getCollectionRef, getDocRef]);

  const createTransfer = useCallback(
    async (data: TransferFormData) => {
      if (!db || !user) throw new Error("Usuário ou DB não inicializado.");

      const batch = writeBatch(db);
      const transferId = doc(collection(db, "temp")).id; // Gera um ID único

      // Lançamento de SAÍDA (despesa)
      const expenseEntryRef = doc(getCollectionRef("financial-entries"));
      const expenseEntry: Omit<FinancialEntry, "id" | "createdAt"> = {
        uid: user.uid,
        description: data.description,
        notes: data.notes || "",
        type: "expense", // Tipo é despesa na conta de origem
        status: "paid", // Transferências são sempre "pagas"
        expectedAmount: data.amount,
        dueDate: data.date,
        paidAmount: data.amount,
        paymentDate: data.date,
        accountId: data.sourceAccountId,
        isTransfer: true,
        transferId: transferId,
      };
      batch.set(expenseEntryRef, {
        ...expenseEntry,
        createdAt: serverTimestamp(),
      });

      // Lançamento de ENTRADA (receita)
      const incomeEntryRef = doc(getCollectionRef("financial-entries"));
      const incomeEntry: Omit<FinancialEntry, "id" | "createdAt"> = {
        uid: user.uid,
        description: data.description,
        notes: data.notes || "",
        type: "income", // Tipo é receita na conta de destino
        status: "paid",
        expectedAmount: data.amount,
        dueDate: data.date,
        paidAmount: data.amount,
        paymentDate: data.date,
        accountId: data.destinationAccountId,
        isTransfer: true,
        transferId: transferId,
      };
      batch.set(incomeEntryRef, {
        ...incomeEntry,
        createdAt: serverTimestamp(),
      });

      // Atualizar saldos das contas (leitura fora do batch, escrita dentro)
      const sourceAccountRef = getDocRef("accounts", data.sourceAccountId);
      const destAccountRef = getDocRef("accounts", data.destinationAccountId);

      const sourceAccountSnap = await getDoc(sourceAccountRef);
      const destAccountSnap = await getDoc(destAccountRef);

      if (!sourceAccountSnap.exists() || !destAccountSnap.exists()) {
        throw new Error("Uma das contas não foi encontrada.");
      }

      const sourceBalance = sourceAccountSnap.data().balance || 0;
      const destBalance = destAccountSnap.data().balance || 0;

      batch.update(sourceAccountRef, { balance: sourceBalance - data.amount });
      batch.update(destAccountRef, { balance: destBalance + data.amount });

      await batch.commit();
    },
    [db, user, getCollectionRef, getDocRef]
  );

  return {
    addFinancialEntry,
    updateFinancialEntry,
    deleteFinancialEntry,
    deleteTransfer,
    processFinancialEntryPayment,
    revertFinancialEntryPayment,
    getFinancialEntryById,
    getRecurrenceRuleById,
    exportUserData,
    importUserData,
    migrateLegacyRecurrences,
    createTransfer,
  };
};
