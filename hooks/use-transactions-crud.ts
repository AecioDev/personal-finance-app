import {
  Firestore,
  collection,
  doc,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import {
  Transaction,
  TransactionType,
  Debt,
  DebtInstallment,
} from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";

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
}

export const useTransactionsCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
  updateAccountBalance,
}: UseTransactionsCrudProps) => {
  const processInstallmentPayment = async (
    installmentId: string,
    paymentData: {
      amount: number;
      accountId: string;
      paymentMethodId: string;
      date: Date;
      interestPaid?: number | null;
      discountReceived?: number | null;
    }
  ) => {
    if (!db || !user || !projectId) {
      const errorMsg = "Firestore, usuário ou ID do projeto não inicializado.";
      setErrorFinanceData(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      await runTransaction(db, async (firestoreTransaction) => {
        const basePath = `artifacts/${projectId}/users/${user.uid}`;

        const installmentRef = doc(
          db,
          `${basePath}/debtInstallments`,
          installmentId
        );
        const installmentSnap = await firestoreTransaction.get(installmentRef);
        if (!installmentSnap.exists())
          throw new Error("Parcela não encontrada.");

        const currentInstallment = installmentSnap.data() as DebtInstallment;
        const debtRef = doc(db, `${basePath}/debts`, currentInstallment.debtId);
        const debtSnap = await firestoreTransaction.get(debtRef);
        if (!debtSnap.exists())
          throw new Error("Dívida principal não encontrada.");

        const currentDebt = debtSnap.data() as Debt;
        const accountRef = doc(
          db,
          `${basePath}/accounts`,
          paymentData.accountId
        );
        const accountSnap = await firestoreTransaction.get(accountRef);
        if (!accountSnap.exists())
          throw new Error("Conta de origem não encontrada.");

        // 1. Criar a nova transação de despesa
        const newTransactionRef = doc(
          collection(db, `${basePath}/transactions`)
        );
        const newTransactionData: Omit<
          Transaction,
          "id" | "uid" | "createdAt"
        > = {
          description: `Pagamento: ${currentDebt.description} #${
            currentInstallment.installmentNumber || ""
          }`,
          amount: paymentData.amount,
          date: paymentData.date,
          type: "expense",
          accountId: paymentData.accountId,
          category: "Pagamento de Dívida",
          paymentMethodId: paymentData.paymentMethodId,
          debtInstallmentId: installmentId,
          interestPaid: paymentData.interestPaid || null,
          discountReceived: paymentData.discountReceived || null,
          isLoanIncome: false,
          loanSource: null,
        };
        firestoreTransaction.set(newTransactionRef, {
          ...newTransactionData,
          uid: user.uid,
          createdAt: serverTimestamp(),
        });

        const interest = paymentData.interestPaid || 0;
        const discount = paymentData.discountReceived || 0;
        const principalPaid = paymentData.amount - interest;
        const newPaidAmount =
          (currentInstallment.paidAmount || 0) + principalPaid;
        const newDiscountAmount =
          (currentInstallment.discountAmount || 0) + discount;
        const newRemainingAmount =
          currentInstallment.expectedAmount - newPaidAmount - newDiscountAmount;
        const newStatus: DebtInstallment["status"] =
          newRemainingAmount <= 0 ? "paid" : "partial";

        // 3. Atualizar a PARCELA
        firestoreTransaction.update(installmentRef, {
          paidAmount: newPaidAmount,
          discountAmount: newDiscountAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paymentDate: paymentData.date,
          transactionIds: [
            ...(currentInstallment.transactionIds || []),
            newTransactionRef.id,
          ],
        });

        // 4. Atualizar o saldo da conta de origem
        const currentBalance = accountSnap.data().balance || 0;
        const newBalance = currentBalance - paymentData.amount;
        firestoreTransaction.update(accountRef, { balance: newBalance });

        // 5. Se a parcela foi quitada, atualizar a DÍVIDA principal
        if (newStatus === "paid" && currentInstallment.status !== "paid") {
          const newPaidInstallments = (currentDebt.paidInstallments || 0) + 1;
          const newIsActive =
            newPaidInstallments < (currentDebt.totalInstallments || 0);
          const newOutstandingBalance =
            (currentDebt.currentOutstandingBalance || 0) -
            currentInstallment.expectedAmount;

          firestoreTransaction.update(debtRef, {
            paidInstallments: newPaidInstallments,
            isActive: newIsActive,
            currentOutstandingBalance:
              newOutstandingBalance > 0 ? newOutstandingBalance : 0,
            totalPaidOnThisDebt:
              (currentDebt.totalPaidOnThisDebt || 0) + newPaidAmount,
          });
        }
      });
      return true;
    } catch (error: any) {
      console.error("Erro na transação de pagamento:", error);
      setErrorFinanceData(`Erro ao processar pagamento: ${error.message}`);
      return false;
    }
  };

  const addGenericTransaction = async (
    transaction: Omit<Transaction, "id" | "uid" | "createdAt">
  ) => {
    if (!db || !user || !projectId) return;
    const newTransactionRef = await addDoc(
      collection(db, `artifacts/${projectId}/users/${user.uid}/transactions`),
      { ...transaction, uid: user.uid, createdAt: serverTimestamp() }
    );
    await updateAccountBalance(
      transaction.accountId,
      transaction.amount,
      transaction.type
    );
    return newTransactionRef.id;
  };

  const deleteTransaction = async (transactionId: string) => {
    // A lógica de deleção precisará ser refatorada para reverter os pagamentos parciais.
  };

  return {
    processInstallmentPayment,
    addGenericTransaction,
    deleteTransaction,
  };
};
