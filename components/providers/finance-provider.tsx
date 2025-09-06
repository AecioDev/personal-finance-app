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
  query,
  where,
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

  refreshData: () => void;
  loadingFinanceData: boolean;
  dataSeedCheckCompleted: boolean;
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

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtInstallments, setDebtInstallments] = useState<DebtInstallment[]>(
    []
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingFinanceData, setLoadingFinanceData] = useState(true);
  const [dataSeedCheckCompleted, setDataSeedCheckCompleted] = useState(false);
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
    refreshTrigger,
    setAccounts,
    setCategories,
    setTransactions,
    setDebts,
    setDebtInstallments,
    setPaymentMethods,
    setLoading: setLoadingFinanceData,
  });

  useEffect(() => {
    if (!loadingFinanceData && user && projectId && !hasCheckedData.current) {
      hasCheckedData.current = true;

      const runDataCheck = async () => {
        console.log(
          "[FinanceProvider] Iniciando verificação de dados padrão..."
        );
        try {
          const db = getFirestore();

          // Helpers -------------------------
          const normalizeString = (str: string) =>
            str
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .trim();

          const findUserCreatedMatch = (
            userCreatedItems: any[],
            defaultItem: any
          ) =>
            userCreatedItems.find((item) => {
              if (item.defaultId) return false; // já migrado
              const normalizedUser = normalizeString(item.name);
              const normalizedDefault = normalizeString(defaultItem.name);
              if (normalizedUser === normalizedDefault) return true;
              if (defaultItem.aliases) {
                return defaultItem.aliases.some(
                  (alias: string) => normalizeString(alias) === normalizedUser
                );
              }
              return false;
            });

          const getUserCollectionRef = (col: string) =>
            collection(db, `artifacts/${projectId}/users/${user.uid}/${col}`);

          // ------------------ Busca inicial ------------------
          const [accountsSnap, categoriesSnap, paymentMethodsSnap] =
            await Promise.all([
              getDocs(getUserCollectionRef("accounts")),
              getDocs(getUserCollectionRef("categories")),
              getDocs(getUserCollectionRef("paymentMethods")),
            ]);

          const existingAccounts = accountsSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as Account)
          );
          const existingCategories = categoriesSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as Category)
          );
          const existingPaymentMethods = paymentMethodsSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as PaymentMethod)
          );

          const batch = writeBatch(db);
          let operationsFound = false;

          // ------------------ 1. Conta padrão ------------------
          const ensureDefaultAccount = () => {
            const hasDefault = existingAccounts.some(
              (acc) => acc.defaultId === defaultAccount.id
            );
            if (hasDefault) return;

            const match = existingAccounts.find(
              (acc) =>
                !acc.defaultId &&
                normalizeString(acc.name) ===
                  normalizeString(defaultAccount.name)
            );

            if (match) {
              batch.update(doc(getUserCollectionRef("accounts"), match.id), {
                defaultId: defaultAccount.id,
              });
              console.log(`Conta "${match.name}" adotada como padrão.`);
              operationsFound = true;
            } else if (existingAccounts.length === 0) {
              const accRef = doc(getUserCollectionRef("accounts"));
              const { id, ...accData } = defaultAccount;
              batch.set(accRef, {
                ...accData,
                uid: user.uid,
                defaultId: id,
                createdAt: new Date(),
              });
              console.log(`Conta padrão "${defaultAccount.name}" criada.`);
              operationsFound = true;
            }
          };

          // ------------------ 2. PaymentMethods padrão ------------------
          const ensureDefaultPaymentMethods = () => {
            defaultPaymentMethods.forEach((pm) => {
              // Se o item padrão já existe, não fazemos nada.
              if (existingPaymentMethods.some((e) => e.defaultId === pm.id)) {
                return;
              }

              const match = findUserCreatedMatch(existingPaymentMethods, pm);
              if (match) {
                const dataToUpdate: {
                  defaultId: string;
                  description?: string;
                } = {
                  defaultId: pm.id,
                };

                if (!match.description && pm.description) {
                  dataToUpdate.description = pm.description;
                }

                batch.update(
                  doc(getUserCollectionRef("paymentMethods"), match.id),
                  dataToUpdate
                );

                console.log(
                  `Forma de Pag. "${match.name}" adotada como "${pm.name}".`
                );
                operationsFound = true;
              } else {
                const pmRef = doc(getUserCollectionRef("paymentMethods"));
                const { id, aliases, ...pmData } = pm;

                console.log(`Dados para '${pm.name}':`, pmData);

                batch.set(pmRef, {
                  ...pmData,
                  uid: user.uid,
                  isActive: true,
                  defaultId: id,
                  createdAt: new Date(),
                });
                console.log(`Forma de Pag. padrão "${pm.name}" criada.`);
                operationsFound = true;
              }
            });
          };

          // ------------------ 3. Categorias padrão ------------------
          const ensureDefaultCategories = () => {
            defaultCategories.forEach((cat) => {
              // Se o item padrão já existe, não fazemos nada.
              if (existingCategories.some((c) => c.defaultId === cat.id)) {
                return;
              }

              const match = findUserCreatedMatch(existingCategories, cat);
              if (match) {
                batch.update(
                  doc(getUserCollectionRef("categories"), match.id),
                  {
                    defaultId: cat.id,
                  }
                );
                console.log(
                  `Categoria "${match.name}" adotada como "${cat.name}".`
                );
                operationsFound = true;
              } else {
                const catRef = doc(getUserCollectionRef("categories"));
                const { id, ...catData } = cat;
                batch.set(catRef, {
                  ...catData,
                  uid: user.uid,
                  defaultId: id,
                  createdAt: new Date(),
                });
                console.log(`Categoria padrão "${cat.name}" criada.`);
                operationsFound = true;
              }
            });
          };

          ensureDefaultAccount();
          ensureDefaultPaymentMethods();
          ensureDefaultCategories();

          if (operationsFound) {
            await batch.commit();
            console.log(
              "[FinanceProvider] Dados padrão migrados/criados com sucesso."
            );
          } else {
            console.log("[FinanceProvider] Nenhuma migração necessária.");
          }
        } catch (err) {
          console.error("[FinanceProvider] Erro na verificação/migração:", err);
          toast({
            title: "Erro de Sincronização",
            description: "Não foi possível verificar os dados padrão.",
            variant: "destructive",
          });
        } finally {
          console.log("[FinanceProvider] Verificação finalizada.");
          setDataSeedCheckCompleted(true);
        }
      };

      runDataCheck();
    }
  }, [loadingFinanceData, user, projectId, debts, toast]);

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

  const refreshData = () => {
    console.log("[FinanceProvider] Forçando a revalidação dos dados...");
    setRefreshTrigger((prev) => prev + 1);
  };

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
        dataSeedCheckCompleted,
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
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
