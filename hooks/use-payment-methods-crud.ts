// in: hooks/use-payment-methods-crud.ts (VERSÃO ATUALIZADA E SEGURA)

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
import { PaymentMethod } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";
import { useCallback } from "react"; // Importar useCallback

interface UsePaymentMethodsCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePaymentMethodsCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UsePaymentMethodsCrudProps) => {
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

  const addPaymentMethod = useCallback(
    async (
      method: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "isActive">
    ) => {
      if (!db || !user) return;
      try {
        await addDoc(getCollectionRef("paymentMethods"), {
          ...method,
          uid: user.uid,
          isActive: true,
          createdAt: serverTimestamp(),
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setErrorFinanceData(
          `Erro ao adicionar forma de pagamento: ${errorMessage}`
        );
        throw new Error("Não foi possível adicionar a forma de pagamento.");
      }
    },
    [db, user, projectId, setErrorFinanceData, getCollectionRef]
  );

  const updatePaymentMethod = useCallback(
    async (
      methodId: string,
      data: Partial<Omit<PaymentMethod, "id" | "uid">>
    ) => {
      if (!db) return;
      try {
        const docRef = doc(getCollectionRef("paymentMethods"), methodId);
        await updateDoc(docRef, data);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setErrorFinanceData(
          `Erro ao atualizar forma de pagamento: ${errorMessage}`
        );
        throw new Error("Não foi possível atualizar a forma de pagamento.");
      }
    },
    [db, projectId, setErrorFinanceData, getCollectionRef]
  );

  const deletePaymentMethod = useCallback(
    async (methodId: string) => {
      if (!db) return;
      try {
        // 1. VERIFICAR SE A FORMA DE PAGAMENTO ESTÁ EM USO
        const entriesQuery = query(
          getCollectionRef("financial-entries"),
          where("paymentMethodId", "==", methodId)
        );
        const entriesSnapshot = await getDocs(entriesQuery);

        // 2. SE ESTIVER EM USO, BLOQUEIA A EXCLUSÃO
        if (!entriesSnapshot.empty) {
          throw new Error(
            `Esta forma de pagamento está em uso por ${entriesSnapshot.size} lançamento(s) e não pode ser excluída.`
          );
        }

        // 3. SE NÃO ESTIVER EM USO, EXCLUI
        await deleteDoc(doc(getCollectionRef("paymentMethods"), methodId));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setErrorFinanceData(
          `Erro ao deletar forma de pagamento: ${errorMessage}`
        );
        throw new Error(errorMessage);
      }
    },
    [db, projectId, setErrorFinanceData, getCollectionRef]
  );

  return { addPaymentMethod, updatePaymentMethod, deletePaymentMethod };
};
