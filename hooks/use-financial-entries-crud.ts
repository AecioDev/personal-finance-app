// in: hooks/use-financial-entries-crud.ts

import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { endOfYear, differenceInCalendarMonths } from "date-fns";
import { FinancialEntryFormData } from "@/schemas/financial-entry-schema";

// Tipos para os dados de entrada
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
  const getCollectionRef = () => {
    if (!db || !user || !projectId) {
      throw new Error("Firestore não inicializado ou usuário não logado.");
    }
    return collection(
      db,
      `artifacts/${projectId}/users/${user.uid}/financial-entries`
    );
  };

  const addFinancialEntry = async (entryData: CreateFinancialEntryData) => {
    try {
      const collectionRef = getCollectionRef();
      const docRef = await addDoc(collectionRef, {
        ...entryData,
        uid: user!.uid,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar lançamento: ${error.message}`);
      throw error;
    }
  };

  const addInstallmentEntry = async (entryData: FinancialEntryFormData) => {
    try {
      const dbInstance = db;
      if (!dbInstance)
        throw new Error("Instância do Firestore não disponível.");

      const collectionRef = getCollectionRef();
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
          status: "pending", // Parcelamentos são sempre criados como pendentes
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
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao criar lançamento parcelado: ${error.message}`
      );
      throw error;
    }
  };

  const addMonthlyRecurringEntries = async (
    entryData: FinancialEntryFormData
  ) => {
    try {
      const dbInstance = db;
      if (!dbInstance)
        throw new Error("Instância do Firestore não disponível.");

      const collectionRef = getCollectionRef();
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
          status: "pending", // Recorrências são sempre criadas como pendentes
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
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao criar lançamentos recorrentes: ${error.message}`
      );
      throw error;
    }
  };

  const updateFinancialEntry = async (
    entryId: string,
    updatedData: Partial<FinancialEntry>
  ) => {
    try {
      const docRef = doc(getCollectionRef(), entryId);
      await updateDoc(docRef, updatedData);
    } catch (error: any) {
      setErrorFinanceData(`Erro ao atualizar lançamento: ${error.message}`);
      throw error;
    }
  };

  const deleteFinancialEntry = async (entryId: string) => {
    try {
      const docRef = doc(getCollectionRef(), entryId);
      await deleteDoc(docRef);
    } catch (error: any) {
      setErrorFinanceData(`Erro ao deletar lançamento: ${error.message}`);
      throw error;
    }
  };

  return {
    addFinancialEntry,
    addInstallmentEntry,
    addMonthlyRecurringEntries,
    updateFinancialEntry,
    deleteFinancialEntry,
  };
};
