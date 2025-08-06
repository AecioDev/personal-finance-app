// hooks/use-categories-crud.ts

import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Category } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";

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
  const getCategoriesCollectionRef = () => {
    if (!db || !user || !projectId) {
      throw new Error("Dependências do Firestore não estão prontas.");
    }
    return collection(
      db,
      `artifacts/${projectId}/users/${user.uid}/categories`
    );
  };

  const getDebtsCollectionRef = () => {
    if (!db || !user || !projectId) {
      throw new Error("Dependências do Firestore não estão prontas.");
    }
    return collection(db, `artifacts/${projectId}/users/${user.uid}/debts`);
  };

  const addCategory = async (data: {
    name: string;
    icon: string;
  }): Promise<string> => {
    try {
      const collectionRef = getCategoriesCollectionRef();
      const docRef = await addDoc(collectionRef, {
        ...data,
        uid: user!.uid,
        createdAt: serverTimestamp(),
      });
      // Retorna o ID do documento recém-criado
      return docRef.id;
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar categoria: ${error.message}`);
      throw error;
    }
  };

  const updateCategory = async (
    id: string,
    data: { name: string; icon: string }
  ) => {
    try {
      const docRef = doc(getCategoriesCollectionRef(), id);
      await updateDoc(docRef, data);
    } catch (error: any) {
      setErrorFinanceData(`Erro ao atualizar categoria: ${error.message}`);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const batch = writeBatch(db!);

      const debtsQuery = query(
        getDebtsCollectionRef(),
        where("categoryId", "==", id)
      );
      const debtsSnapshot = await getDocs(debtsQuery);
      debtsSnapshot.forEach((debtDoc) => {
        batch.update(debtDoc.ref, { categoryId: null });
      });

      const categoryDocRef = doc(getCategoriesCollectionRef(), id);
      batch.delete(categoryDocRef);

      await batch.commit();
    } catch (error: any) {
      setErrorFinanceData(`Erro ao excluir categoria: ${error.message}`);
      throw error;
    }
  };

  return { addCategory, updateCategory, deleteCategory };
};
