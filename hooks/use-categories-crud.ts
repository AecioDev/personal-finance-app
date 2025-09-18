// hooks/use-categories-crud.ts (VERSÃO FINAL COM useCallback)

import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { CategoryType } from "@/interfaces/finance";
import { useCallback } from "react";

interface UseCategoriesCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useCategoriesCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UseCategoriesCrudProps) => {
  const getCollectionRef = useCallback(
    (collectionName: string) => {
      if (!db || !user || !projectId) {
        throw new Error("Dependências do Firestore não estão prontas.");
      }
      return collection(
        db,
        `artifacts/${projectId}/users/${user.uid}/${collectionName}`
      );
    },
    [db, user, projectId]
  );

  const addCategory = useCallback(
    async (data: {
      name: string;
      icon: string;
      type: CategoryType;
      defaultId?: string;
    }): Promise<string> => {
      if (!user) throw new Error("Usuário não autenticado.");
      try {
        const collectionRef = getCollectionRef("categories");
        const docRef = await addDoc(collectionRef, {
          ...data,
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
        return docRef.id;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setErrorFinanceData(`Erro ao adicionar categoria: ${errorMessage}`);
        throw new Error("Erro ao adicionar categoria.");
      }
    },
    [user, getCollectionRef, setErrorFinanceData]
  );

  const updateCategory = useCallback(
    async (id: string, data: { name: string; icon: string }) => {
      try {
        const docRef = doc(getCollectionRef("categories"), id);
        await updateDoc(docRef, data);
      } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
          setErrorFinanceData(
            `Erro ao atualizar categoria: ${String(error.message)}`
          );
        }
        throw new Error("Erro ao atualizar categoria.");
      }
    },
    [getCollectionRef, setErrorFinanceData]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        const entriesQuery = query(
          getCollectionRef("financial-entries"),
          where("categoryId", "==", id)
        );
        const entriesSnapshot = await getDocs(entriesQuery);

        if (!entriesSnapshot.empty) {
          throw new Error(
            `Esta categoria está em uso por ${entriesSnapshot.size} lançamento(s) e não pode ser excluída.`
          );
        }

        const categoryDocRef = doc(getCollectionRef("categories"), id);
        await deleteDoc(categoryDocRef);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.";
        console.error("Erro ao excluir categoria:", errorMessage);
        setErrorFinanceData(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [getCollectionRef, setErrorFinanceData]
  );

  const migrateCategoryTypes = useCallback(
    async (incomeCategoryIds: string[], allUntaggedIds: string[]) => {
      if (!db || !user || !projectId)
        throw new Error("Dependências não estão prontas.");

      const batch = writeBatch(db);
      const incomeSet = new Set(incomeCategoryIds);

      allUntaggedIds.forEach((catId) => {
        const categoryRef = doc(getCollectionRef("categories"), catId);
        const type = incomeSet.has(catId) ? "income" : "expense";
        batch.update(categoryRef, { type: type });
      });

      const settingsRef = doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/profile`,
        "settings"
      );
      batch.set(
        settingsRef,
        { categoryTypeMigrationCompleted: true },
        { merge: true }
      );

      await batch.commit();
    },
    [db, user, projectId, getCollectionRef]
  );

  return { addCategory, updateCategory, deleteCategory, migrateCategoryTypes };
};
