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
import {
  Transaction,
  TransactionType,
  Debt,
  DebtInstallment,
  PaymentMethod,
} from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";
import { useDebtInstallmentsCrud } from "./use-debt-installments-crud";
import { useDebtsCrud } from "./use-debts-crud";

interface UseTransactionsCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
  updateAccountBalance: (
    accountId: string,
    amount: number,
    type: TransactionType
  ) => Promise<void>;
  debtInstallments: DebtInstallment[];
  debts: Debt[];
  paymentMethods: PaymentMethod[];
}

export const useTransactionsCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
  updateAccountBalance,
  debtInstallments,
  debts,
  paymentMethods,
}: UseTransactionsCrudProps) => {
  const { updateDebtInstallment } = useDebtInstallmentsCrud({
    db,
    user,
    projectId,
    setErrorFinanceData,
  });
  const { updateDebt } = useDebtsCrud({
    db,
    user,
    projectId,
    setErrorFinanceData,
  });

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "uid" | "createdAt">
  ) => {
    // ALTERADO: Verifica se user (objeto completo) é null antes de user?.uid
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      let finalAccountId = transaction.accountId;
      if (transaction.debtInstallmentId && transaction.paymentMethodId) {
        const selectedMethod = paymentMethods.find(
          (pm) => pm.id === transaction.paymentMethodId
        );
        if (selectedMethod?.defaultAccountId) {
          finalAccountId = selectedMethod.defaultAccountId;
        }
      }

      const newTransactionRef = await addDoc(
        collection(db, `artifacts/${projectId}/users/${user.uid}/transactions`),
        {
          ...transaction,
          accountId: finalAccountId,
          uid: user.uid,
          createdAt: serverTimestamp(),
        }
      );
      console.log("useTransactionsCrud: Transação adicionada com sucesso.");

      await updateAccountBalance(
        finalAccountId,
        transaction.amount,
        transaction.type
      );

      if (transaction.debtInstallmentId) {
        const installment = debtInstallments.find(
          (inst) => inst.id === transaction.debtInstallmentId
        );
        if (installment) {
          const expectedAmountValue = installment.expectedAmount || 0;
          const debt = debts.find((d) => d.id === installment.debtId);
          if (debt) {
            const interestPaid =
              transaction.amount > expectedAmountValue
                ? transaction.amount - expectedAmountValue
                : 0;
            const finePaid = 0;

            await updateDebtInstallment(installment.id, {
              status: "paid",
              actualPaidAmount: transaction.amount,
              interestPaidOnInstallment: interestPaid,
              finePaidOnInstallment: finePaid,
              paymentDate: transaction.date,
              transactionId: newTransactionRef.id,
            });

            const newOutstandingBalance =
              (debt.currentOutstandingBalance || 0) - expectedAmountValue;
            const newTotalPaid =
              (debt.totalPaidOnThisDebt || 0) + transaction.amount;
            const newTotalInterestPaid =
              (debt.totalInterestPaidOnThisDebt || 0) + interestPaid;
            const newTotalFinePaid =
              (debt.totalFinePaidOnThisDebt || 0) + finePaid;
            const newPaidInstallments = (debt.paidInstallments || 0) + 1;
            const newIsActive = newOutstandingBalance > 0;

            await updateDebt(debt.id, {
              currentOutstandingBalance: newOutstandingBalance,
              totalPaidOnThisDebt: newTotalPaid,
              totalInterestPaidOnThisDebt: newTotalInterestPaid,
              totalFinePaidOnThisDebt: newTotalFinePaid,
              paidInstallments: newPaidInstallments,
              isActive: newIsActive,
            });
            console.log(
              "useTransactionsCrud: Dívida e parcela atualizadas após pagamento."
            );
          }
        }
      }
    } catch (error: any) {
      setErrorFinanceData(`Erro ao adicionar transação: ${error.message}`);
      console.error("useTransactionsCrud: Erro ao adicionar transação:", error);
    }
  };

  const updateTransaction = async (
    transactionId: string,
    data: Partial<Omit<Transaction, "id" | "uid" | "createdAt">>
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
          `artifacts/${projectId}/users/${user.uid}/transactions`,
          transactionId
        ),
        data
      );
      console.log("useTransactionsCrud: Transação atualizada com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao atualizar transação: ${error.message}`);
      console.error("useTransactionsCrud: Erro ao atualizar transação:", error);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    // ALTERADO: Verifica se user (objeto completo) é null antes de user?.uid
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      const transactionDocRef = doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/transactions`,
        transactionId
      );
      const transactionSnapshot = await getDoc(transactionDocRef);
      const transactionToDelete = transactionSnapshot.data() as Transaction;

      if (transactionToDelete) {
        const reverseType =
          transactionToDelete.type === "income" ? "expense" : "income";
        await updateAccountBalance(
          transactionToDelete.accountId,
          transactionToDelete.amount,
          reverseType
        );

        if (transactionToDelete.debtInstallmentId) {
          const installmentDocRef = doc(
            db,
            `artifacts/${projectId}/users/${user.uid}/debtInstallments`,
            transactionToDelete.debtInstallmentId
          );
          const installmentSnapshot = await getDoc(installmentDocRef);
          const installment = installmentSnapshot.data() as DebtInstallment;

          if (installment) {
            const expectedAmountValue = installment.expectedAmount || 0;
            await updateDebtInstallment(installment.id, {
              status: "pending",
              actualPaidAmount: null,
              interestPaidOnInstallment: null,
              finePaidOnInstallment: null,
              paymentDate: null,
              transactionId: null,
            });

            const debtDocRef = doc(
              db,
              `artifacts/${projectId}/users/${user.uid}/debts`,
              installment.debtId
            );
            const debtSnapshot = await getDoc(debtDocRef);
            const debt = debtSnapshot.data() as Debt;

            if (debt) {
              const newOutstandingBalance =
                (debt.currentOutstandingBalance || 0) + expectedAmountValue;
              const newTotalPaid =
                (debt.totalPaidOnThisDebt || 0) - transactionToDelete.amount;
              const newTotalInterestPaid =
                (debt.totalInterestPaidOnThisDebt || 0) -
                (installment.interestPaidOnInstallment || 0);
              const newTotalFinePaid =
                (debt.totalFinePaidOnThisDebt || 0) -
                (installment.finePaidOnInstallment || 0);
              const newPaidInstallments = (debt.paidInstallments || 0) - 1;
              const newIsActive = true;

              await updateDebt(debt.id, {
                currentOutstandingBalance: newOutstandingBalance,
                totalPaidOnThisDebt: newTotalPaid,
                totalInterestPaidOnThisDebt: newTotalInterestPaid,
                totalFinePaidOnThisDebt: newTotalFinePaid,
                paidInstallments: newPaidInstallments,
                isActive: newIsActive,
              });
            }
          }
        }
      }

      await deleteDoc(
        doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/transactions`,
          transactionId
        )
      );
      console.log("useTransactionsCrud: Transação deletada com sucesso.");
    } catch (error: any) {
      setErrorFinanceData(`Erro ao deletar transação: ${error.message}`);
      console.error("useTransactionsCrud: Erro ao deletar transação:", error);
    }
  };

  return { addTransaction, updateTransaction, deleteTransaction };
};
