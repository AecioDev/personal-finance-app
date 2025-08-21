import {
  Firestore,
  collection,
  doc,
  addDoc,
  serverTimestamp,
  runTransaction,
  Timestamp, // Importar o tipo Timestamp
} from "firebase/firestore";
import {
  Transaction,
  TransactionType,
  Debt,
  DebtInstallment,
  Account,
} from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

    console.log("Hook - Payload: ", paymentData);
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

        // Os dados lidos aqui dentro da transação terão Timestamps do Firestore
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

        let description = currentDebt.description;

        if (currentDebt.isRecurring) {
          // --- CORREÇÃO APLICADA AQUI ---
          // O valor de 'expectedDueDate' vindo do snapshot é um Timestamp do Firestore.
          // Precisamos convertê-lo para um objeto Date do JS usando o método .toDate().
          const dueDate =
            currentInstallment.expectedDueDate as unknown as Timestamp;
          const date = dueDate.toDate();

          if (isNaN(date.getTime())) {
            throw new Error("Data de vencimento (expectedDueDate) inválida.");
          }

          const formattedDate = format(date, "MMM/yy", { locale: ptBR });
          description += ` - ${
            formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
          }`;
        } else if (
          currentDebt.totalInstallments &&
          currentDebt.totalInstallments > 1
        ) {
          description += ` - ${currentInstallment.installmentNumber} / ${currentDebt.totalInstallments}`;
        }

        const newTransactionRef = doc(
          collection(db, `${basePath}/transactions`)
        );

        const categoryIdForTransaction = currentDebt.categoryId;
        if (!categoryIdForTransaction) {
          throw new Error(
            `A dívida '${currentDebt.description}' não possui uma categoria.`
          );
        }

        const newTransactionData: Omit<
          Transaction,
          "id" | "uid" | "createdAt"
        > = {
          description: description,
          amount: paymentData.amount,
          date: paymentData.date, // Este já é um objeto Date, vindo do formulário
          type: "expense",
          accountId: paymentData.accountId,
          categoryId: categoryIdForTransaction,
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
          interestPaidAmount:
            (currentInstallment.interestPaidAmount || 0) + interest,
        });

        const currentBalance = accountSnap.data().balance || 0;
        const newBalance = currentBalance - paymentData.amount;
        firestoreTransaction.update(accountRef, { balance: newBalance });

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
            totalInterestPaidOnThisDebt:
              (currentDebt.totalInterestPaidOnThisDebt || 0) + interest,
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

  const revertInstallmentPayment = async (installmentId: string) => {
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
        const installment = installmentSnap.data() as DebtInstallment;

        if (
          !installment.transactionIds ||
          installment.transactionIds.length === 0
        ) {
          firestoreTransaction.update(installmentRef, {
            status: "pending",
            currentDueAmount: installment.expectedAmount,
          });
          return;
        }

        const debtRef = doc(db, `${basePath}/debts`, installment.debtId);
        const debtSnap = await firestoreTransaction.get(debtRef);
        if (!debtSnap.exists())
          throw new Error("Dívida principal não encontrada.");
        const debt = debtSnap.data() as Debt;

        let totalRevertedAmount = 0;
        let totalInterestReverted = 0;

        for (const transId of installment.transactionIds) {
          const transactionRef = doc(db, `${basePath}/transactions`, transId);
          const transactionSnap = await firestoreTransaction.get(
            transactionRef
          );

          if (transactionSnap.exists()) {
            const trans = transactionSnap.data() as Transaction;
            totalRevertedAmount += trans.amount;
            totalInterestReverted += trans.interestPaid || 0;

            const accountRef = doc(db, `${basePath}/accounts`, trans.accountId);
            const accountSnap = await firestoreTransaction.get(accountRef);
            if (accountSnap.exists()) {
              const account = accountSnap.data() as Account;
              const newBalance = (account.balance || 0) + trans.amount;
              firestoreTransaction.update(accountRef, { balance: newBalance });
            }
            firestoreTransaction.delete(transactionRef);
          }
        }

        const wasPaid = installment.status === "paid";
        firestoreTransaction.update(debtRef, {
          paidInstallments: wasPaid
            ? (debt.paidInstallments || 1) - 1
            : debt.paidInstallments || 0,
          currentOutstandingBalance:
            (debt.currentOutstandingBalance || 0) + installment.expectedAmount,
          totalPaidOnThisDebt:
            (debt.totalPaidOnThisDebt || 0) -
            (totalRevertedAmount - totalInterestReverted),
          totalInterestPaidOnThisDebt:
            (debt.totalInterestPaidOnThisDebt || 0) - totalInterestReverted,
          isActive: true,
        });

        firestoreTransaction.update(installmentRef, {
          paidAmount: 0,
          discountAmount: 0,
          interestPaidAmount: 0,
          remainingAmount: installment.expectedAmount,
          currentDueAmount: installment.expectedAmount,
          status: "pending",
          paymentDate: null,
          transactionIds: [],
        });
      });

      return true;
    } catch (error: any) {
      console.error("Erro na transação de reversão de pagamento:", error);
      setErrorFinanceData(`Erro ao reverter pagamento: ${error.message}`);
      throw error;
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
    revertInstallmentPayment,
    addGenericTransaction,
    deleteTransaction,
  };
};
