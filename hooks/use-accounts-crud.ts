// in: hooks/use-accounts-crud.ts (VERSÃO ATUALIZADA E SEGURA)

import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Account } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";
import { useCallback } from "react"; // Importar useCallback

interface UseAccountsCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useAccountsCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UseAccountsCrudProps) => {
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

  const addAccount = useCallback(
    async (account: Omit<Account, "id" | "uid">) => {
      if (!db || !user) return;
      try {
        await addDoc(getCollectionRef("accounts"), {
          ...account,
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setErrorFinanceData(`Erro ao adicionar conta: ${errorMessage}`);
        throw new Error("Não foi possível adicionar a conta. Tente novamente.");
      }
    },
    [db, user, projectId, setErrorFinanceData, getCollectionRef]
  );

  const updateAccount = useCallback(
    async (accountId: string, data: Partial<Omit<Account, "id" | "uid">>) => {
      if (!db) return;
      try {
        await updateDoc(doc(getCollectionRef("accounts"), accountId), data);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setErrorFinanceData(`Erro ao atualizar conta: ${errorMessage}`);
        throw new Error("Não foi possível atualizar a conta. Tente novamente.");
      }
    },
    [db, projectId, setErrorFinanceData, getCollectionRef]
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      if (!db) return;
      try {
        // 1. VERIFICAR SE A CONTA ESTÁ EM USO
        const entriesQuery = query(
          getCollectionRef("financial-entries"),
          where("accountId", "==", accountId)
        );
        const entriesSnapshot = await getDocs(entriesQuery);

        // 2. SE ESTIVER EM USO, BLOQUEIA A EXCLUSÃO
        if (!entriesSnapshot.empty) {
          throw new Error(
            `Esta conta está em uso por ${entriesSnapshot.size} lançamento(s) e não pode ser excluída.`
          );
        }

        // 3. SE NÃO ESTIVER EM USO, EXCLUI
        await deleteDoc(doc(getCollectionRef("accounts"), accountId));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setErrorFinanceData(`Erro ao deletar conta: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    },
    [db, projectId, setErrorFinanceData, getCollectionRef]
  );

  return { addAccount, updateAccount, deleteAccount };
};
