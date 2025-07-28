import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { DebtType } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";

interface UseDebtTypesCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useDebtTypesCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UseDebtTypesCrudProps) => {
  const addDebtType = async (
    debtType: Omit<DebtType, "id" | "uid" | "createdAt" | "isActive">
  ) => {
    // ALTERADO: Verifica se user (objeto completo) é null antes de user?.uid
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await addDoc(
        collection(db, `artifacts/${projectId}/users/${user.uid}/debtTypes`),
        {
          ...debtType,
          uid: user.uid,
          isActive: true,
          createdAt: serverTimestamp(),
        }
      );
      console.log("useDebtTypesCrud: Tipo de dívida adicionado com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar tipo de dívida: ${error.message}`);
      console.error(
        "useDebtTypesCrud: Erro ao adicionar tipo de dívida:",
        error
      );
    }
  };

  const updateDebtType = async (
    debtTypeId: string,
    data: Partial<Omit<DebtType, "id" | "uid">>
  ) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await updateDoc(
        doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/debtTypes`,
          debtTypeId
        ),
        data
      );
      console.log("useDebtTypesCrud: Tipo de dívida atualizado com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao atualizar tipo de dívida: ${error.message}`);
      console.error(
        "useDebtTypesCrud: Erro ao atualizar tipo de dívida:",
        error
      );
    }
  };

  const deleteDebtType = async (debtTypeId: string) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await deleteDoc(
        doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/debtTypes`,
          debtTypeId
        )
      );
      console.log("useDebtTypesCrud: Tipo de dívida deletado com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao deletar tipo de dívida: ${error.message}`);
      console.error("useDebtTypesCrud: Erro ao deletar tipo de dívida:", error);
    }
  };

  return { addDebtType, updateDebtType, deleteDebtType };
};
