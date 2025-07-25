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
import { addMonths, format } from "date-fns";

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

  const addDebt = async (
    debt: Omit<
      Debt,
      | "id"
      | "uid"
      | "createdAt"
      | "currentOutstandingBalance"
      | "totalPaidOnThisDebt"
      | "totalInterestPaidOnThisDebt"
      | "totalFinePaidOnThisDebt"
      | "paidInstallments"
      | "isActive"
    >
  ) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      const newDebtData = {
        ...debt,
        uid: user.uid,
        createdAt: serverTimestamp(),
        currentOutstandingBalance: debt.isRecurring ? 0 : debt.originalAmount,
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
      console.log("useDebtsCrud: Dívida adicionada com sucesso.");

      const generatedInstallments: Omit<
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
      >[] = [];
      const startDate = new Date(debt.startDate);

      if (debt.isRecurring) {
        const numInstallmentsToGenerate = 12;
        for (let i = 0; i < numInstallmentsToGenerate; i++) {
          const expectedDueDate = addMonths(startDate, i);
          generatedInstallments.push({
            debtId: debtRef.id,
            installmentNumber: i + 1,
            expectedDueDate: format(expectedDueDate, "yyyy-MM-dd"),
            expectedAmount: debt.originalAmount,
          });
        }
        console.log(
          `useDebtsCrud: Geradas ${numInstallmentsToGenerate} ocorrências para dívida recorrente.`
        );
      } else if (
        debt.totalInstallments &&
        debt.totalInstallments > 0 &&
        debt.expectedInstallmentAmount
      ) {
        for (let i = 0; i < debt.totalInstallments; i++) {
          const expectedDueDate = addMonths(startDate, i);
          generatedInstallments.push({
            debtId: debtRef.id,
            installmentNumber: i + 1,
            expectedDueDate: format(expectedDueDate, "yyyy-MM-dd"),
            expectedAmount: debt.expectedInstallmentAmount,
          });
        }
        console.log(
          `useDebtsCrud: Geradas ${debt.totalInstallments} parcelas para dívida parcelada.`
        );
      } else {
        generatedInstallments.push({
          debtId: debtRef.id,
          installmentNumber: 1,
          expectedDueDate: format(startDate, "yyyy-MM-dd"),
          expectedAmount: debt.originalAmount,
        });
        console.log("useDebtsCrud: Gerada 1 parcela para dívida única.");
      }

      for (const inst of generatedInstallments) {
        await addDebtInstallment(inst);
      }
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar dívida: ${error.message}`);
      console.error("useDebtsCrud: Erro ao adicionar dívida:", error);
    }
  };

  const updateDebt = async (
    debtId: string,
    data: Partial<Omit<Debt, "id" | "uid">>
  ) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await updateDoc(
        doc(db, `artifacts/${projectId}/users/${user.uid}/debts`, debtId),
        data
      );
      console.log("useDebtsCrud: Dívida atualizada com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao atualizar dívida: ${error.message}`);
      console.error("useDebtsCrud: Erro ao atualizar dívida:", error);
    }
  };

  const deleteDebt = async (debtId: string): Promise<boolean> => {
    // ALTERADO: Retorna Promise<boolean>
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
        if (installmentData.transactionId) {
          hasLinkedTransactions = true;
          return;
        }
        batch.delete(installmentDoc.ref);
      });

      if (hasLinkedTransactions) {
        setErrorFinanceData(
          "Não é possível excluir esta dívida. Há lançamentos financeiros vinculados a uma ou mais parcelas. Por favor, exclua os lançamentos das parcelas primeiro."
        );
        console.warn(
          "useDebtsCrud: Tentativa de excluir dívida com parcelas vinculadas a lançamentos."
        );
        return false;
      }

      batch.delete(
        doc(db, `artifacts/${projectId}/users/${user.uid}/debts`, debtId)
      );

      await batch.commit();
      console.log(
        "useDebtsCrud: Dívida e suas parcelas deletadas com sucesso."
      );
      return true; // Retorna true em caso de sucesso
    } catch (error: any) {
      setErrorFinanceData(`Erro ao deletar dívida: ${error.message}`);
      console.error("useDebtsCrud: Erro ao deletar dívida:", error);
      return false; // Retorna false em caso de erro
    }
  };

  return { addDebt, updateDebt, deleteDebt };
};
