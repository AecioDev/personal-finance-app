"use client";

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { getApp } from "firebase/app";
import { getFirestore, Firestore, doc, updateDoc } from "firebase/firestore";

import {
  Account,
  Transaction,
  TransactionType,
  Debt,
  DebtInstallment,
  PaymentMethod,
  DebtType,
} from "@/interfaces/finance";
import { useAuth } from "./auth-provider";

import { useFinanceData } from "@/hooks/use-finance-data";
import { useAccountsCrud } from "@/hooks/use-accounts-crud";
import { useTransactionsCrud } from "@/hooks/use-transactions-crud";
import { useDebtsCrud } from "@/hooks/use-debts-crud";
import { useDebtInstallmentsCrud } from "@/hooks/use-debt-installments-crud";
import { usePaymentMethodsCrud } from "@/hooks/use-payment-methods-crud";
import { useDebtTypesCrud } from "@/hooks/use-debt-types-crud";
import { DebtFormData } from "@/schemas/debt-schema"; // Import necessário

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  debtInstallments: DebtInstallment[];
  paymentMethods: PaymentMethod[];
  debtTypes: DebtType[];

  processInstallmentPayment: (
    installmentId: string,
    paymentData: {
      amount: number;
      accountId: string;
      paymentMethodId: string;
      date: Date;
      interestPaid?: number | null;
      discountReceived?: number | null;
    }
  ) => Promise<boolean>;

  addGenericTransaction: (
    transaction: Omit<Transaction, "id" | "uid" | "createdAt">
  ) => Promise<string | undefined>;
  addAccount: (account: Omit<Account, "id" | "uid">) => Promise<void>;
  updateAccount: (
    accountId: string,
    data: Partial<Omit<Account, "id" | "uid">>
  ) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;

  // GÊ: AQUI ESTÁ A MUDANÇA!
  // A assinatura agora reflete exatamente o que o formulário envia e o hook espera.
  addDebt: (debtData: DebtFormData) => Promise<void>;

  updateDebt: (debtId: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<boolean>;
  addDebtInstallment: (
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
  ) => Promise<void>;
  updateDebtInstallment: (
    installmentId: string,
    data: Partial<Omit<DebtInstallment, "id" | "uid">>
  ) => Promise<void>;
  deleteDebtInstallment: (installmentId: string) => Promise<boolean>;
  addPaymentMethod: (
    method: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "isActive">
  ) => Promise<void>;
  updatePaymentMethod: (
    methodId: string,
    data: Partial<Omit<PaymentMethod, "id" | "uid">>
  ) => Promise<void>;
  deletePaymentMethod: (methodId: string) => Promise<void>;
  addDebtType: (
    debtType: Omit<DebtType, "id" | "uid" | "createdAt" | "isActive">
  ) => Promise<void>;
  updateDebtType: (
    debtTypeId: string,
    data: Partial<Omit<DebtType, "id" | "uid">>
  ) => Promise<void>;
  deleteDebtType: (debtTypeId: string) => Promise<void>;
  getAccountById: (id: string) => Account | undefined;

  loadingFinanceData: boolean;
  errorFinanceData: string | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance deve ser usado dentro de um FinanceProvider");
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, loading: authLoading, projectId } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtInstallments, setDebtInstallments] = useState<DebtInstallment[]>(
    []
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [debtTypes, setDebtTypes] = useState<DebtType[]>([]);
  const [loadingFinanceData, setLoadingFinanceData] = useState(true);
  const [errorFinanceData, setErrorFinanceData] = useState<string | null>(null);
  const dbRef = React.useRef<Firestore | null>(null);

  useEffect(() => {
    if (!authLoading && projectId && user) {
      try {
        const app = getApp();
        dbRef.current = getFirestore(app);
      } catch (error: any) {
        console.error("FinanceProvider: Erro ao inicializar Firestore:", error);
      }
    }
  }, [authLoading, projectId, user]);

  useFinanceData({
    db: dbRef.current,
    user,
    projectId,
    setAccounts,
    setTransactions,
    setDebts,
    setDebtInstallments,
    setPaymentMethods,
    setDebtTypes,
  });

  useEffect(() => {
    if (authLoading) {
      setLoadingFinanceData(true);
    } else {
      setLoadingFinanceData(false);
    }
  }, [authLoading]);

  const updateAccountBalance = async (
    accountId: string,
    amount: number,
    type: TransactionType
  ) => {
    if (!dbRef.current || !user?.uid || !projectId) return;
    const accountRef = doc(
      dbRef.current,
      `artifacts/${projectId}/users/${user.uid}/accounts`,
      accountId
    );
    try {
      const currentAccount = accounts.find((acc) => acc.id === accountId);
      if (currentAccount && typeof currentAccount.balance === "number") {
        const newBalance =
          type === "income"
            ? currentAccount.balance + amount
            : currentAccount.balance - amount;
        await updateDoc(accountRef, { balance: newBalance });
      }
    } catch (error: any) {
      console.error(
        "FinanceProvider: Erro ao atualizar saldo da conta:",
        error
      );
    }
  };

  const { addAccount, updateAccount, deleteAccount } = useAccountsCrud({
    db: dbRef.current,
    user,
    projectId,
    setErrorFinanceData,
  });
  const { addDebtInstallment, updateDebtInstallment, deleteDebtInstallment } =
    useDebtInstallmentsCrud({
      db: dbRef.current,
      user,
      projectId,
      setErrorFinanceData,
    });
  const { addDebt, updateDebt, deleteDebt } = useDebtsCrud({
    db: dbRef.current,
    user,
    projectId,
    setErrorFinanceData,
  });
  const { addPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethodsCrud({
      db: dbRef.current,
      user,
      projectId,
      setErrorFinanceData,
    });
  const { addDebtType, updateDebtType, deleteDebtType } = useDebtTypesCrud({
    db: dbRef.current,
    user,
    projectId,
    setErrorFinanceData,
  });

  const {
    processInstallmentPayment,
    addGenericTransaction,
    deleteTransaction,
  } = useTransactionsCrud({
    db: dbRef.current,
    user,
    projectId,
    setErrorFinanceData,
    updateAccountBalance,
  });

  const getAccountById = (id: string) => accounts.find((acc) => acc.id === id);

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        debts,
        debtInstallments,
        paymentMethods,
        debtTypes,
        loadingFinanceData,
        errorFinanceData,
        addAccount,
        updateAccount,
        deleteAccount,
        deleteTransaction,
        addDebt,
        updateDebt,
        deleteDebt,
        addDebtInstallment,
        updateDebtInstallment,
        deleteDebtInstallment,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        addDebtType,
        updateDebtType,
        deleteDebtType,
        getAccountById,
        processInstallmentPayment,
        addGenericTransaction,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
