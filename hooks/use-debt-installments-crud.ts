import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { DebtInstallment } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";

interface UseDebtInstallmentsCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useDebtInstallmentsCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UseDebtInstallmentsCrudProps) => {
  const addDebtInstallment = async (
    installment: Omit<
      DebtInstallment,
      | "id"
      | "uid"
      | "createdAt"
      | "status"
      | "actualPaidAmount"
      | "interestPaidOnInstallment"
      | "finePaidOnInstallment"
      | "paymentDate"
      | "transactionId"
    >
  ) => {
    // ALTERADO: Verifica se user (objeto completo) é null antes de user?.uid
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await addDoc(
        collection(
          db,
          `artifacts/${projectId}/users/${user.uid}/debtInstallments`
        ),
        {
          ...installment,
          uid: user.uid,
          status: "pending",
          actualPaidAmount: null,
          interestPaidOnInstallment: null,
          finePaidOnInstallment: null,
          paymentDate: null,
          transactionId: null,
          createdAt: serverTimestamp(),
        }
      );
      console.log(
        "useDebtInstallmentsCrud: Parcela de dívida adicionada com sucesso."
      );
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao adicionar parcela de dívida: ${error.message}`
      );
      console.error(
        "useDebtInstallmentsCrud: Erro ao adicionar parcela de dívida:",
        error
      );
    }
  };

  const updateDebtInstallment = async (
    installmentId: string,
    data: Partial<Omit<DebtInstallment, "id" | "uid">>
  ) => {
    // ALTERADO: Verifica se user (objeto completo) é null antes de user?.uid
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await updateDoc(
        doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/debtInstallments`,
          installmentId
        ),
        data
      );
      console.log(
        "useDebtInstallmentsCrud: Parcela de dívida atualizada com sucesso."
      );
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao atualizar parcela de dívida: ${error.message}`
      );
      console.error(
        "useDebtInstallmentsCrud: Erro ao atualizar parcela de dívida:",
        error
      );
    }
  };

  const deleteDebtInstallment = async (installmentId: string) => {
    // ALTERADO: Verifica se user (objeto completo) é null antes de user?.uid
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await deleteDoc(
        doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/debtInstallments`,
          installmentId
        )
      );
      console.log(
        "useDebtInstallmentsCrud: Parcela de dívida deletada com sucesso."
      );
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao deletar parcela de dívida: ${error.message}`
      );
      console.error(
        "useDebtInstallmentsCrud: Erro ao deletar parcela de dívida:",
        error
      );
    }
  };

  return { addDebtInstallment, updateDebtInstallment, deleteDebtInstallment };
};
