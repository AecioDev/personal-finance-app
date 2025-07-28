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
  /**
   * GÊ: AQUI ESTÁ A CORREÇÃO!
   * Esta função agora cria uma nova parcela já com os campos necessários
   * para o sistema de pagamento parcial.
   */
  const addDebtInstallment = async (
    installment: Omit<
      DebtInstallment,
      | "id"
      | "uid"
      | "createdAt"
      | "paidAmount"
      | "remainingAmount"
      | "discountAmount"
      | "status"
      | "paymentDate"
      | "transactionIds"
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
          createdAt: serverTimestamp(),
          // Inicializando os novos campos com valores padrão
          paidAmount: 0,
          discountAmount: 0,
          remainingAmount: installment.expectedAmount, // O valor restante inicial é o valor total esperado
          status: "pending",
          paymentDate: null,
          transactionIds: [], // Começa com um array vazio de transações
        }
      );
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao adicionar parcela de dívida: ${error.message}`
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
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao atualizar parcela de dívida: ${error.message}`
      );
    }
  };

  const deleteDebtInstallment = async (
    installmentId: string
  ): Promise<boolean> => {
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

      // GÊ: Lógica de deleção atualizada para o novo campo 'transactionIds'
      if (
        installmentData &&
        installmentData.transactionIds &&
        installmentData.transactionIds.length > 0
      ) {
        setErrorFinanceData(
          "Não é possível excluir esta parcela, pois existem pagamentos vinculados a ela."
        );
        return false;
      }

      await deleteDoc(installmentRef);
      return true;
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao deletar parcela de dívida: ${error.message}`
      );
      return false;
    }
  };

  return { addDebtInstallment, updateDebtInstallment, deleteDebtInstallment };
};
