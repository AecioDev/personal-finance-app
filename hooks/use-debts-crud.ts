import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  getDocs,
  writeBatch,
  where,
} from "firebase/firestore";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";
import { useDebtInstallmentsCrud } from "./use-debt-installments-crud";
import { addMonths } from "date-fns";
import { DebtFormData } from "@/schemas/debt-schema";

interface UseDebtsCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useDebtsCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UseDebtsCrudProps) => {
  const { addDebtInstallment } = useDebtInstallmentsCrud({
    db,
    user,
    projectId,
    setErrorFinanceData,
  });

  const addDebt = async (debtData: DebtFormData) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      let totalRepaymentAmount: number | null = null;
      if (
        !debtData.isRecurring &&
        debtData.totalInstallments &&
        debtData.expectedInstallmentAmount
      ) {
        totalRepaymentAmount =
          debtData.totalInstallments * debtData.expectedInstallmentAmount;
      } else if (!debtData.isRecurring) {
        totalRepaymentAmount = debtData.originalAmount;
      }

      const newDebtData = {
        ...debtData,
        totalRepaymentAmount,
        uid: user.uid,
        createdAt: serverTimestamp(),
        // GÊ: AQUI ESTÁ A CORREÇÃO!
        // O saldo devedor inicial é o valor total a pagar.
        currentOutstandingBalance: totalRepaymentAmount,
        totalPaidOnThisDebt: 0,
        totalInterestPaidOnThisDebt: 0,
        totalFinePaidOnThisDebt: 0,
        paidInstallments: 0,
        isActive: true,
      };

      const debtRef = await addDoc(
        collection(db, `artifacts/${projectId}/users/${user.uid}/debts`),
        newDebtData
      );

      const generatedInstallments: Omit<
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
      >[] = [];
      const startDate = debtData.startDate;

      if (debtData.isRecurring) {
        for (let i = 0; i < 12; i++) {
          generatedInstallments.push({
            debtId: debtRef.id,
            installmentNumber: i + 1,
            expectedDueDate: addMonths(startDate, i),
            expectedAmount: debtData.originalAmount,
          });
        }
      } else if (
        debtData.totalInstallments &&
        debtData.totalInstallments > 0 &&
        debtData.expectedInstallmentAmount
      ) {
        for (let i = 0; i < debtData.totalInstallments; i++) {
          generatedInstallments.push({
            debtId: debtRef.id,
            installmentNumber: i + 1,
            expectedDueDate: addMonths(startDate, i),
            expectedAmount: debtData.expectedInstallmentAmount,
          });
        }
      } else {
        generatedInstallments.push({
          debtId: debtRef.id,
          installmentNumber: 1,
          expectedDueDate: startDate,
          expectedAmount: debtData.originalAmount,
        });
      }

      for (const inst of generatedInstallments) {
        await addDebtInstallment(inst);
      }
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar dívida: ${error.message}`);
    }
  };

  const updateDebt = async (debtId: string, data: Partial<Debt>) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    const debtRef = doc(
      db,
      `artifacts/${projectId}/users/${user.uid}/debts`,
      debtId
    );
    await updateDoc(debtRef, data);
  };

  const deleteDebt = async (debtId: string): Promise<boolean> => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return false;
    }
    try {
      const installmentsQuery = query(
        collection(
          db,
          `artifacts/${projectId}/users/${user.uid}/debtInstallments`
        ),
        where("debtId", "==", debtId)
      );
      const installmentsSnap = await getDocs(installmentsQuery);

      const batch = writeBatch(db);

      let hasLinkedTransactions = false;
      installmentsSnap.forEach((installmentDoc) => {
        const installmentData = installmentDoc.data() as DebtInstallment;
        if (
          installmentData.transactionIds &&
          installmentData.transactionIds.length > 0
        ) {
          hasLinkedTransactions = true;
        }
        batch.delete(installmentDoc.ref);
      });

      if (hasLinkedTransactions) {
        setErrorFinanceData(
          "Não é possível excluir. Há pagamentos vinculados a uma ou mais parcelas."
        );
        return false;
      }

      const debtRef = doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/debts`,
        debtId
      );
      batch.delete(debtRef);

      await batch.commit();
      return true;
    } catch (error: any) {
      setErrorFinanceData(`Erro ao deletar dívida: ${error.message}`);
      return false;
    }
  };

  return { addDebt, updateDebt, deleteDebt };
};
