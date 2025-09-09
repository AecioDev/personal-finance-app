// in: components/providers/finance-provider.tsx

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
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";

import { Account, Category, PaymentMethod } from "@/interfaces/finance";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { useAuth } from "./auth-provider";
import { useFinanceData } from "@/hooks/use-finance-data";
import { useAccountsCrud } from "@/hooks/use-accounts-crud";
import { usePaymentMethodsCrud } from "@/hooks/use-payment-methods-crud";
import { useCategoriesCrud } from "@/hooks/use-categories-crud";
import { useFinancialEntriesCrud } from "@/hooks/use-financial-entries-crud";
import { useToast } from "@/components/ui/use-toast";
import {
  defaultAccount,
  defaultCategories,
  defaultPaymentMethods,
} from "@/lib/data/defaults";

interface FinanceContextType {
  // Estados
  accounts: Account[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  financialEntries: FinancialEntry[];
  loadingFinanceData: boolean;
  dataSeedCheckCompleted: boolean;
  errorFinanceData: string | null;

  // Funções CRUD
  addAccount: ReturnType<typeof useAccountsCrud>["addAccount"];
  updateAccount: ReturnType<typeof useAccountsCrud>["updateAccount"];
  deleteAccount: ReturnType<typeof useAccountsCrud>["deleteAccount"];
  addCategory: ReturnType<typeof useCategoriesCrud>["addCategory"];
  updateCategory: ReturnType<typeof useCategoriesCrud>["updateCategory"];
  deleteCategory: ReturnType<typeof useCategoriesCrud>["deleteCategory"];
  addPaymentMethod: ReturnType<
    typeof usePaymentMethodsCrud
  >["addPaymentMethod"];
  updatePaymentMethod: ReturnType<
    typeof usePaymentMethodsCrud
  >["updatePaymentMethod"];
  deletePaymentMethod: ReturnType<
    typeof usePaymentMethodsCrud
  >["deletePaymentMethod"];
  getAccountById: (id: string) => Account | undefined;
  refreshData: () => void;

  // Funções CRUD de Lançamentos Financeiros ATUALIZADAS
  addFinancialEntry: ReturnType<
    typeof useFinancialEntriesCrud
  >["addFinancialEntry"];
  addInstallmentEntry: ReturnType<
    typeof useFinancialEntriesCrud
  >["addInstallmentEntry"];
  addMonthlyRecurringEntries: ReturnType<
    typeof useFinancialEntriesCrud
  >["addMonthlyRecurringEntries"];
  updateFinancialEntry: ReturnType<
    typeof useFinancialEntriesCrud
  >["updateFinancialEntry"];
  deleteFinancialEntry: ReturnType<
    typeof useFinancialEntriesCrud
  >["deleteFinancialEntry"];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading, projectId } = useAuth();
  const dbRef = useRef<Firestore | null>(null);
  const hasCheckedData = useRef(false);
  const { toast } = useToast();

  // Estados
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(
    []
  );
  const [loadingFinanceData, setLoadingFinanceData] = useState(true);
  const [errorFinanceData, setErrorFinanceData] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dataSeedCheckCompleted, setDataSeedCheckCompleted] = useState(false);

  useEffect(() => {
    if (!authLoading && user && projectId) {
      try {
        const app = getApp();
        dbRef.current = getFirestore(app);
      } catch (error) {
        console.error("FinanceProvider: Erro ao inicializar Firestore:", error);
      }
    }
  }, [authLoading, user, projectId]);

  useFinanceData({
    db: dbRef.current,
    user,
    projectId,
    refreshTrigger,
    setAccounts,
    setCategories,
    setPaymentMethods,
    setFinancialEntries,
    setLoading: setLoadingFinanceData,
  });

  useEffect(() => {
    if (user && projectId && !hasCheckedData.current) {
      hasCheckedData.current = true;
      const runDataCheck = async () => {
        console.log(
          "[FinanceProvider] Iniciando verificação de dados padrão..."
        );
        try {
          const db = getFirestore();

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
              if (item.defaultId) return false;
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

          const ensureDefaultPaymentMethods = () => {
            defaultPaymentMethods.forEach((pm) => {
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

          const ensureDefaultCategories = () => {
            defaultCategories.forEach((cat) => {
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
  }, [user, projectId, toast]);

  // Hooks CRUD
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
  const { addPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethodsCrud({
      db: dbRef.current,
      user,
      projectId,
      setErrorFinanceData,
    });

  // Hook de Lançamentos Financeiros ATUALIZADO
  const {
    addFinancialEntry,
    addInstallmentEntry,
    addMonthlyRecurringEntries,
    updateFinancialEntry,
    deleteFinancialEntry,
  } = useFinancialEntriesCrud({
    db: dbRef.current,
    user,
    projectId,
    setErrorFinanceData,
  });

  const getAccountById = (id: string) => accounts.find((acc) => acc.id === id);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        paymentMethods,
        financialEntries,
        loadingFinanceData,
        dataSeedCheckCompleted,
        errorFinanceData,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        getAccountById,
        refreshData,
        // Funções de Lançamentos Financeiros ATUALIZADAS
        addFinancialEntry,
        addInstallmentEntry,
        addMonthlyRecurringEntries,
        updateFinancialEntry,
        deleteFinancialEntry,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
