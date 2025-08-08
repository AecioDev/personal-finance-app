import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { Debt, DebtInstallment } from "@/interfaces/finance";
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
          paidAmount: 0,
          discountAmount: 0,
          remainingAmount: installment.expectedAmount,
          status: "pending",
          paymentDate: null,
          transactionIds: [],
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

  const updateInstallmentValue = async (
    debtId: string,
    installmentId: string,
    newAmount: number
  ) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }

    const debtDocRef = doc(
      db,
      `artifacts/${projectId}/users/${user.uid}/debts`,
      debtId
    );
    const installmentDocRef = doc(
      db,
      `artifacts/${projectId}/users/${user.uid}/debtInstallments`,
      installmentId
    );

    try {
      const batch = writeBatch(db);

      const debtSnap = await getDoc(debtDocRef);
      const installmentSnap = await getDoc(installmentDocRef);

      if (!debtSnap.exists() || !installmentSnap.exists()) {
        setErrorFinanceData("Dívida ou parcela não encontrada.");
      }

      const currentDebt = debtSnap.data() as Debt;
      const currentInstallment = installmentSnap.data() as DebtInstallment;

      const oldAmount = currentInstallment.expectedAmount;
      const difference = newAmount - oldAmount;

      batch.update(installmentDocRef, {
        expectedAmount: newAmount,
      });

      batch.update(debtDocRef, {
        currentOutstandingBalance:
          (currentDebt.currentOutstandingBalance || 0) + difference,
        lastBalanceUpdate: serverTimestamp(),
      });

      await batch.commit();
    } catch (error: any) {
      setErrorFinanceData(
        `Erro ao atualizar valor da parcela: ${error.message}`
      );
      throw error;
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

  return {
    addDebtInstallment,
    updateDebtInstallment,
    updateInstallmentValue,
    deleteDebtInstallment,
  };
};
