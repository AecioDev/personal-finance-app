import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  getDocs,
  writeBatch,
  where,
  runTransaction,
} from "firebase/firestore";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";
import { useDebtInstallmentsCrud } from "./use-debt-installments-crud";
import { addMonths } from "date-fns";
import { DebtFormData } from "@/schemas/debt-schema";
import { SimpleDebtFormData } from "@/schemas/simple-debt-schema";

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
        const startMonth = startDate.getMonth();
        const installmentsToCreate = 12 - startMonth;

        for (let i = 0; i < installmentsToCreate; i++) {
          generatedInstallments.push({
            debtId: debtRef.id,
            installmentNumber: i + 1,
            expectedDueDate: addMonths(startDate, i),
            expectedAmount: debtData.originalAmount,
            currentDueAmount: debtData.originalAmount,
            interestPaidAmount: 0,
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
            currentDueAmount: debtData.expectedInstallmentAmount,
            interestPaidAmount: 0,
          });
        }
      } else {
        generatedInstallments.push({
          debtId: debtRef.id,
          installmentNumber: 1,
          expectedDueDate: startDate,
          expectedAmount: debtData.originalAmount,
          currentDueAmount: debtData.originalAmount,
          interestPaidAmount: 0,
        });
      }

      for (const inst of generatedInstallments) {
        await addDebtInstallment(inst);
      }
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar dívida: ${error.message}`);
      throw error;
    }
  };

  const addDebtAndPay = async (data: SimpleDebtFormData) => {
    if (
      !db ||
      !user ||
      !projectId ||
      !data.accountId ||
      !data.paymentMethodId
    ) {
      const errorMsg = "Dados insuficientes para registrar e pagar a dívida.";
      setErrorFinanceData(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      await runTransaction(db, async (firestoreTransaction) => {
        const basePath = `artifacts/${projectId}/users/${user.uid}`;

        if (!data.accountId) {
          throw new Error("ID da conta não foi fornecido para a transação.");
        }
        const accountRef = doc(db, `${basePath}/accounts`, data.accountId);
        const accountSnap = await firestoreTransaction.get(accountRef);
        if (!accountSnap.exists()) throw new Error("Conta não encontrada.");

        const newDebtRef = doc(collection(db, `${basePath}/debts`));
        const debtPayload = {
          description: data.name,
          type: "simple",
          originalAmount: data.amount,
          totalRepaymentAmount: data.amount,
          isRecurring: false,
          totalInstallments: 1,
          expectedInstallmentAmount: data.amount,
          startDate: data.dueDate,
          categoryId: data.categoryId,
          uid: user.uid,
          createdAt: serverTimestamp(),
          currentOutstandingBalance: 0,
          totalPaidOnThisDebt: data.amount,
          paidInstallments: 1,
          isActive: false,
        };
        firestoreTransaction.set(newDebtRef, debtPayload);

        const newInstallmentRef = doc(
          collection(db, `${basePath}/debtInstallments`)
        );
        const installmentPayload = {
          debtId: newDebtRef.id,
          uid: user.uid,
          installmentNumber: 1,
          expectedDueDate: data.dueDate,
          expectedAmount: data.amount,
          paidAmount: data.amount,
          remainingAmount: 0,
          currentDueAmount: data.amount,
          discountAmount: 0,
          interestPaidAmount: 0,
          status: "paid" as const,
          paymentDate: new Date(),
          transactionIds: [] as string[],
          createdAt: serverTimestamp(),
        };

        const newTransactionRef = doc(
          collection(db, `${basePath}/transactions`)
        );
        const transactionPayload = {
          accountId: data.accountId,
          type: "expense" as const,
          description: data.name,
          amount: data.amount,
          date: new Date(),
          categoryId: data.categoryId,
          uid: user.uid,
          createdAt: serverTimestamp(),
          debtInstallmentId: newInstallmentRef.id,
          paymentMethodId: data.paymentMethodId,
          interestPaid: null,
          discountReceived: null,
          isLoanIncome: false,
          loanSource: null,
        };
        firestoreTransaction.set(newTransactionRef, transactionPayload);

        installmentPayload.transactionIds = [newTransactionRef.id];
        firestoreTransaction.set(newInstallmentRef, installmentPayload);

        const currentBalance = accountSnap.data().balance || 0;
        const newBalance = currentBalance - data.amount;
        firestoreTransaction.update(accountRef, { balance: newBalance });
      });
    } catch (error: any) {
      setErrorFinanceData(
        `Erro na transação de registrar e pagar: ${error.message}`
      );
      throw error;
    }
  };

  const updateDebt = async (debtId: string, data: Partial<Debt>) => {
    // ... (função existente sem alterações)
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
    // ... (função existente sem alterações)
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

  return { addDebt, updateDebt, deleteDebt, addDebtAndPay }; // NOVO: Exportando a nova função
};
