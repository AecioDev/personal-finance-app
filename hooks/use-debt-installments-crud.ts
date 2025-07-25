import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
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

  const deleteDebtInstallment = async (
    installmentId: string
  ): Promise<boolean> => {
    // Assinatura para retornar Promise<boolean>
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return false;
    }
    try {
      const installmentRef = doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/debtInstallments`,
        installmentId
      );
      const installmentSnap = await getDoc(installmentRef);
      const installmentData = installmentSnap.data() as DebtInstallment;

      if (installmentData && installmentData.transactionId) {
        setErrorFinanceData(
          "Não é possível excluir esta parcela. Há um lançamento financeiro vinculado a ela. Por favor, exclua o lançamento primeiro."
        );
        console.warn(
          "useDebtInstallmentsCrud: Tentativa de excluir parcela com lançamento vinculado."
        );
        return false;
      }

      await deleteDoc(installmentRef);
      console.log(
        "useDebtInstallmentsCrud: Parcela de dívida deletada com sucesso."
      );
      return true; // Retorna true em caso de sucesso
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao deletar parcela de dívida: ${error.message}`
      );
      console.error(
        "useDebtInstallmentsCrud: Erro ao deletar parcela de dívida:",
        error
      );
      return false; // Retorna false em caso de erro
    }
  };

  return { addDebtInstallment, updateDebtInstallment, deleteDebtInstallment };
};
