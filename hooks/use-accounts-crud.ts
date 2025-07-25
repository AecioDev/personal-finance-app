import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Account, TransactionType } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";

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
  const addAccount = async (account: Omit<Account, "id" | "uid">) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await addDoc(
        collection(db, `artifacts/${projectId}/users/${user.uid}/accounts`),
        {
          ...account,
          uid: user.uid,
          createdAt: serverTimestamp(),
        }
      );
      console.log("useAccountsCrud: Conta adicionada com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar conta: ${error.message}`);
      console.error("useAccountsCrud: Erro ao adicionar conta:", error);
    }
  };

  const updateAccount = async (
    accountId: string,
    data: Partial<Omit<Account, "id" | "uid">>
  ) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await updateDoc(
        doc(db, `artifacts/${projectId}/users/${user.uid}/accounts`, accountId),
        data
      );
      console.log("useAccountsCrud: Conta atualizada com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao atualizar conta: ${error.message}`);
      console.error("useAccountsCrud: Erro ao atualizar conta:", error);
    }
  };

  const deleteAccount = async (accountId: string) => {
    // ALTERADO: Verifica se user (objeto completo) é null antes de user?.uid
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await deleteDoc(
        doc(db, `artifacts/${projectId}/users/${user.uid}/accounts`, accountId)
      );
      console.log("useAccountsCrud: Conta deletada com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao deletar conta: ${error.message}`);
      console.error("useAccountsCrud: Erro ao deletar conta:", error);
    }
  };

  return { addAccount, updateAccount, deleteAccount };
};
