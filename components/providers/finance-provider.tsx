"use client";

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useRef,
} from "react";
import { getApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  doc,
  updateDoc,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";

import {
  Account,
  Category,
  Transaction,
  TransactionType,
  Debt,
  DebtInstallment,
  PaymentMethod,
} from "@/interfaces/finance";
import { useAuth } from "./auth-provider";
import {
  defaultCategories,
  defaultPaymentMethods,
  defaultAccount,
} from "@/lib/data/defaults";

import { useFinanceData } from "@/hooks/use-finance-data";
import { useAccountsCrud } from "@/hooks/use-accounts-crud";
import { useTransactionsCrud } from "@/hooks/use-transactions-crud";
import { useDebtsCrud } from "@/hooks/use-debts-crud";
import { useDebtInstallmentsCrud } from "@/hooks/use-debt-installments-crud";
import { usePaymentMethodsCrud } from "@/hooks/use-payment-methods-crud";
import { useCategoriesCrud } from "@/hooks/use-categories-crud";
import { DebtFormData } from "@/schemas/debt-schema";
import { SimpleDebtFormData } from "@/schemas/simple-debt-schema";
import { useToast } from "../ui/use-toast";

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  debtInstallments: DebtInstallment[];
  paymentMethods: PaymentMethod[];

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

  revertInstallmentPayment: (installmentId: string) => Promise<boolean>;

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

  addDebt: (debtData: DebtFormData) => Promise<void>;
  updateDebt: (debtId: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<boolean>;
  addDebtAndPay: (data: SimpleDebtFormData) => Promise<void>;
  updateSimpleDebt: (debtId: string, data: Partial<Debt>) => Promise<void>;

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
  updateInstallmentValue: (
    debtId: string,
    installmentId: string,
    newAmount: number
  ) => Promise<void>;

  addPaymentMethod: (
    method: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "isActive">
  ) => Promise<void>;
  updatePaymentMethod: (
    methodId: string,
    data: Partial<Omit<PaymentMethod, "id" | "uid">>
  ) => Promise<void>;
  deletePaymentMethod: (methodId: string) => Promise<void>;

  addCategory: (data: { name: string; icon: string }) => Promise<string | null>;
  updateCategory: (
    id: string,
    data: { name: string; icon: string }
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

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
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtInstallments, setDebtInstallments] = useState<DebtInstallment[]>(
    []
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingFinanceData, setLoadingFinanceData] = useState(true);
  const [errorFinanceData, setErrorFinanceData] = useState<string | null>(null);
  const dbRef = useRef<Firestore | null>(null);
  const hasCheckedData = useRef(false);

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
    setCategories,
    setTransactions,
    setDebts,
    setDebtInstallments,
    setPaymentMethods,
    setLoading: setLoadingFinanceData,
  });

  useEffect(() => {
    // Roda apenas se:
    // 1. O carregamento inicial dos dados terminou
    // 2. O usuário está logado
    // 3. A verificação ainda NÃO foi feita nesta sessão
    if (!loadingFinanceData && user && projectId && !hasCheckedData.current) {
      const runDataCheck = async () => {
        console.log("Iniciando verificação de dados padrão (com migração)...");
        hasCheckedData.current = true; // Impede que o hook rode novamente na mesma sessão

        const normalizeString = (str: string) =>
          str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

        try {
          const db = getFirestore();
          const batch = writeBatch(db);

          const getUserCollectionRef = (collectionName: string) =>
            collection(
              db,
              `artifacts/${projectId}/users/${user.uid}/${collectionName}`
            );

          // Buscamos os dados existentes
          const accountsSnap = await getDocs(getUserCollectionRef("accounts"));
          const categoriesSnap = await getDocs(
            getUserCollectionRef("categories")
          );
          const paymentMethodsSnap = await getDocs(
            getUserCollectionRef("paymentMethods")
          );

          const existingAccounts = accountsSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Account)
          );
          const existingCategories = categoriesSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Category)
          );
          const existingPaymentMethods = paymentMethodsSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as PaymentMethod)
          );

          let operationsFound = false;

          // 1. Conta Padrão (Lógica Corrigida)
          if (
            !existingAccounts.some((acc) => acc.defaultId === defaultAccount.id)
          ) {
            const userCreatedMatch = existingAccounts.find(
              (acc) =>
                !acc.defaultId &&
                normalizeString(acc.name) ===
                  normalizeString(defaultAccount.name)
            );
            if (userCreatedMatch) {
              // "Adota" a conta existente
              const accRef = doc(
                getUserCollectionRef("accounts"),
                userCreatedMatch.id
              );
              batch.update(accRef, { defaultId: defaultAccount.id });
              operationsFound = true;
            } else if (existingAccounts.length === 0) {
              // Só cria se o usuário não tiver NENHUMA conta
              const accountRef = doc(getUserCollectionRef("accounts"));
              const { id, ...accData } = defaultAccount;
              batch.set(accountRef, {
                ...accData,
                uid: user.uid,
                defaultId: id,
                createdAt: new Date(), // Adiciona o createdAt
              });
              operationsFound = true;
            }
          }

          // 2. Formas de Pagamento (Lógica mantida, pois estava correta)
          defaultPaymentMethods.forEach((defaultPM: any) => {
            if (
              existingPaymentMethods.some((pm) => pm.defaultId === defaultPM.id)
            )
              return;

            const userCreatedMatch = existingPaymentMethods.find((pm) => {
              if (pm.defaultId) return false;
              const normalizedExistingName = normalizeString(pm.name);
              const normalizedDefaultName = normalizeString(defaultPM.name);

              if (normalizedExistingName === normalizedDefaultName) return true;

              if (defaultPM.aliases) {
                return defaultPM.aliases.some(
                  (alias: string) =>
                    normalizeString(alias) === normalizedExistingName
                );
              }
              return false;
            });

            if (userCreatedMatch) {
              const pmRef = doc(
                getUserCollectionRef("paymentMethods"),
                userCreatedMatch.id
              );
              batch.update(pmRef, { defaultId: defaultPM.id });
              operationsFound = true;
            } else {
              const pmRef = doc(getUserCollectionRef("paymentMethods"));
              const { id, aliases, ...pmData } = defaultPM;
              batch.set(pmRef, {
                ...pmData,
                uid: user.uid,
                isActive: true,
                defaultId: id,
                createdAt: new Date(),
              });
              operationsFound = true;
            }
          });

          // 3. Categorias (Lógica mantida, pois estava correta)
          defaultCategories.forEach((defaultCat: any) => {
            if (
              existingCategories.some((cat) => cat.defaultId === defaultCat.id)
            )
              return;

            const userCreatedMatch = existingCategories.find((cat) => {
              if (cat.defaultId) return false;
              const normalizedExistingName = normalizeString(cat.name);
              const normalizedDefaultName = normalizeString(defaultCat.name);

              if (normalizedExistingName === normalizedDefaultName) return true;

              if (defaultCat.aliases) {
                return defaultCat.aliases.some(
                  (alias: string) =>
                    normalizeString(alias) === normalizedExistingName
                );
              }
              return false;
            });

            if (userCreatedMatch) {
              const catRef = doc(
                getUserCollectionRef("categories"),
                userCreatedMatch.id
              );
              batch.update(catRef, { defaultId: defaultCat.id });
              operationsFound = true;
            } else {
              const catRef = doc(getUserCollectionRef("categories"));
              const { id, aliases, ...catData } = defaultCat;
              batch.set(catRef, {
                ...catData,
                uid: user.uid,
                defaultId: id,
                createdAt: new Date(),
              });
              operationsFound = true;
            }
          });

          if (operationsFound) {
            await batch.commit();
            console.log("Dados padrão criados ou migrados com sucesso.");
          }

          // 4. Lógica de Dívidas sem Categoria (Agora roda de forma segura)
          const debtsToUpdate = debts.filter((debt) => !debt.categoryId);
          if (debtsToUpdate.length > 0) {
            // Re-busca as categorias para garantir que temos a mais atualizada
            const finalCategoriesSnap = await getDocs(
              getUserCollectionRef("categories")
            );
            const allCategories = finalCategoriesSnap.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Category)
            );

            const genericCategory = allCategories.find(
              (c) => c.defaultId === "default-outras-despesas" // Busca pelo ID padrão
            );

            if (genericCategory) {
              const debtBatch = writeBatch(db);
              debtsToUpdate.forEach((debt) => {
                const debtRef = doc(
                  db,
                  `artifacts/${projectId}/users/${user.uid}/debts`,
                  debt.id
                );
                debtBatch.update(debtRef, { categoryId: genericCategory.id });
              });
              await debtBatch.commit();
              console.log(
                `${debtsToUpdate.length} dívidas foram atualizadas com categoria padrão.`
              );
            }
          }
        } catch (err) {
          console.error("Erro na verificação/migração de dados:", err);
          toast({
            title: "Erro de Sincronização",
            description: "Não foi possível verificar os dados padrão.",
            variant: "destructive",
          });
        }
      };

      runDataCheck();
    }
  }, [loadingFinanceData, user, projectId, toast]);

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

  const { addCategory, updateCategory, deleteCategory } = useCategoriesCrud({
    db: dbRef.current,
    user,
    projectId,
    setErrorFinanceData,
  });

  const { addDebt, updateDebt, deleteDebt, addDebtAndPay, updateSimpleDebt } =
    useDebtsCrud({
      db: dbRef.current,
      user,
      projectId,
      setErrorFinanceData,
    });

  const {
    addDebtInstallment,
    updateDebtInstallment,
    updateInstallmentValue,
    deleteDebtInstallment,
  } = useDebtInstallmentsCrud({
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

  const {
    processInstallmentPayment,
    revertInstallmentPayment,
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
        categories,
        transactions,
        debts,
        debtInstallments,
        paymentMethods,
        loadingFinanceData,
        errorFinanceData,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        deleteTransaction,
        addDebt,
        updateDebt,
        deleteDebt,
        addDebtAndPay,
        updateSimpleDebt,
        addDebtInstallment,
        updateDebtInstallment,
        updateInstallmentValue,
        deleteDebtInstallment,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        getAccountById,
        processInstallmentPayment,
        revertInstallmentPayment,
        addGenericTransaction,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
