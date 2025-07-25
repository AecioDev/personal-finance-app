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

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  debtInstallments: DebtInstallment[];
  paymentMethods: PaymentMethod[];
  debtTypes: DebtType[];

  addAccount: (account: Omit<Account, "id" | "uid">) => Promise<void>;
  updateAccount: (
    accountId: string,
    data: Partial<Omit<Account, "id" | "uid">>
  ) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;

  addTransaction: (
    transaction: Omit<Transaction, "id" | "uid" | "createdAt">
  ) => Promise<void>;
  updateTransaction: (
    transactionId: string,
    data: Partial<Omit<Transaction, "id" | "uid" | "createdAt">>
  ) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;

  addDebt: (
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
    >,
    initialInstallments?: Omit<DebtInstallment, "id" | "uid" | "createdAt">[]
  ) => Promise<void>;
  updateDebt: (
    debtId: string,
    data: Partial<Omit<Debt, "id" | "uid">>
  ) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<boolean>;

  addDebtInstallment: (
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
  getDebtById: (id: string) => Debt | undefined;
  getPaymentMethodById: (id: string) => PaymentMethod | undefined;
  getDebtTypeById: (id: string) => DebtType | undefined;

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
  const [isFirestoreInitialized, setIsFirestoreInitialized] = useState(false);

  useEffect(() => {
    console.log(
      "FinanceProvider: Iniciando useEffect de inicialização do Firestore..."
    );
    if (!authLoading && projectId) {
      try {
        const app = getApp();
        dbRef.current = getFirestore(app);
        setIsFirestoreInitialized(true);
        setErrorFinanceData(null);
        console.log("FinanceProvider: Firestore inicializado.");
      } catch (error: any) {
        setErrorFinanceData(
          `FinanceProvider: Erro ao inicializar Firestore: ${error.message}`
        );
        console.error("FinanceProvider: Erro ao inicializar Firestore:", error);
        setIsFirestoreInitialized(false);
      }
    } else if (authLoading) {
      setLoadingFinanceData(true);
      setIsFirestoreInitialized(false);
    } else if (!user && !authLoading) {
      setAccounts([]);
      setTransactions([]);
      setDebts([]);
      setDebtInstallments([]);
      setPaymentMethods([]);
      setDebtTypes([]);
      setLoadingFinanceData(false);
      setIsFirestoreInitialized(false);
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
    if (!isFirestoreInitialized || !user) {
      setLoadingFinanceData(true);
    } else {
      setLoadingFinanceData(false);
    }
  }, [isFirestoreInitialized, user]);

  const updateAccountBalance = async (
    accountId: string,
    amount: number,
    type: TransactionType
  ) => {
    if (!dbRef.current || !user?.uid || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    const accountRef = doc(
      dbRef.current,
      `artifacts/${projectId}/users/${user.uid}/accounts`,
      accountId
    );
    console.log("FinanceProvider: Atualizando saldo da conta:", accountId);
    try {
      const currentAccount = accounts.find((acc) => acc.id === accountId);
      if (currentAccount) {
        const newBalance =
          type === "income"
            ? currentAccount.balance + amount
            : currentAccount.balance - amount;
        await updateDoc(accountRef, { balance: newBalance });
        console.log("FinanceProvider: Saldo da conta atualizado com sucesso.");
      }
    } catch (error: any) {
      setErrorFinanceData(`Erro ao atualizar saldo da conta: ${error.message}`);
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

  const { addTransaction, updateTransaction, deleteTransaction } =
    useTransactionsCrud({
      db: dbRef.current,
      user,
      projectId,
      setErrorFinanceData,
      updateAccountBalance,
      debtInstallments,
      debts,
      paymentMethods,
    });

  const getAccountById = (id: string) => accounts.find((acc) => acc.id === id);
  const getDebtById = (id: string) => debts.find((debt) => debt.id === id);
  const getPaymentMethodById = (id: string) =>
    paymentMethods.find((method) => method.id === id);
  const getDebtTypeById = (id: string) =>
    debtTypes.find((type) => type.id === id);

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        debts,
        debtInstallments,
        paymentMethods,
        debtTypes,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
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
        getDebtById,
        getPaymentMethodById,
        getDebtTypeById,
        loadingFinanceData,
        errorFinanceData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
