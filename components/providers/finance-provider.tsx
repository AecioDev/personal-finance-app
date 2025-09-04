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
        console.log("-------------------------------------------");
        console.log("LOG 1: Iniciando runDataCheck...");
        hasCheckedData.current = true;

        // --- Funções Helper para a Migração ---

        const normalizeString = (str: string) =>
          str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

        /**
         * Função de busca inteligente para encontrar correspondências
         * entre os dados padrão e os dados que o usuário já criou.
         */
        const findUserCreatedMatch = (
          userCreatedItems: any[],
          defaultItem: any
        ) => {
          return userCreatedItems.find((userItem) => {
            // Ignora itens que já foram migrados
            if (userItem.defaultId) return false;

            const normalizedUserItemName = normalizeString(userItem.name);
            const normalizedDefaultItemName = normalizeString(defaultItem.name);

            // 1. Verifica se o nome principal bate
            if (normalizedUserItemName === normalizedDefaultItemName) {
              return true;
            }

            // 2. Verifica se o nome do usuário bate com algum dos "apelidos" do item padrão
            //    É aqui que "Cartão de Crédito" (do usuário) vai dar match com "Crédito" (padrão)
            if (defaultItem.aliases) {
              return defaultItem.aliases.some(
                (alias: string) =>
                  normalizeString(alias) === normalizedUserItemName
              );
            }

            return false;
          });
        };

        try {
          console.log("LOG 2: Entrando no bloco try/catch.");
          const db = getFirestore();
          const batch = writeBatch(db);

          const getUserCollectionRef = (collectionName: string) =>
            collection(
              db,
              `artifacts/${projectId}/users/${user.uid}/${collectionName}`
            );

          // Buscamos os dados existentes do usuário
          console.log("LOG 3: Buscando 'accounts' no Firestore...");
          const accountsSnap = await getDocs(getUserCollectionRef("accounts"));
          console.log(
            `LOG 4: Busca de 'accounts' concluída. Encontrados ${accountsSnap.docs.length} documentos.`
          );

          console.log("LOG 5: Buscando 'categories' no Firestore...");
          const categoriesSnap = await getDocs(
            getUserCollectionRef("categories")
          );
          console.log(
            `LOG 6: Busca de 'categories' concluída. Encontrados ${categoriesSnap.docs.length} documentos.`
          );

          console.log("LOG 7: Buscando 'paymentMethods' no Firestore...");
          const paymentMethodsSnap = await getDocs(
            getUserCollectionRef("paymentMethods")
          );
          console.log(
            `LOG 8: Busca de 'paymentMethods' concluída. Encontrados ${paymentMethodsSnap.docs.length} documentos.`
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
          console.log("LOG 9: Iniciando lógica de migração...");

          // --- 1. Lógica da Conta Padrão ---
          const hasDefaultAccount = existingAccounts.some(
            (acc) => acc.defaultId === defaultAccount.id
          );
          if (!hasDefaultAccount) {
            const userCreatedMatch = existingAccounts.find(
              (acc) =>
                !acc.defaultId &&
                normalizeString(acc.name) ===
                  normalizeString(defaultAccount.name)
            );

            if (userCreatedMatch) {
              // "Adota" a conta que o usuário criou
              const accRef = doc(
                getUserCollectionRef("accounts"),
                userCreatedMatch.id
              );
              batch.update(accRef, { defaultId: defaultAccount.id });
              operationsFound = true;
              console.log(
                `Conta "${userCreatedMatch.name}" adotada como padrão.`
              );
            } else if (existingAccounts.length === 0) {
              // Só cria se o usuário não tiver NENHUMA conta
              const accountRef = doc(getUserCollectionRef("accounts"));
              const { id, ...accData } = defaultAccount;
              batch.set(accountRef, {
                ...accData,
                uid: user.uid,
                defaultId: id,
                createdAt: new Date(),
              });
              operationsFound = true;
              console.log(`Conta padrão "${defaultAccount.name}" criada.`);
            }
          }

          // --- 2. Lógica das Formas de Pagamento (Refatorada) ---
          defaultPaymentMethods.forEach((defaultPM) => {
            const alreadyExists = existingPaymentMethods.some(
              (pm) => pm.defaultId === defaultPM.id
            );
            if (alreadyExists) return;

            const userCreatedMatch = findUserCreatedMatch(
              existingPaymentMethods,
              defaultPM
            );

            if (userCreatedMatch) {
              const pmRef = doc(
                getUserCollectionRef("paymentMethods"),
                userCreatedMatch.id
              );
              batch.update(pmRef, { defaultId: defaultPM.id });
              operationsFound = true;
              console.log(
                `Forma de Pag. "${userCreatedMatch.name}" adotada como "${defaultPM.name}".`
              );
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
              console.log(`Forma de Pag. padrão "${defaultPM.name}" criada.`);
            }
          });

          // --- 3. Lógica das Categorias (Refatorada) ---
          defaultCategories.forEach((defaultCat) => {
            const alreadyExists = existingCategories.some(
              (cat) => cat.defaultId === defaultCat.id
            );
            if (alreadyExists) return;

            const userCreatedMatch = findUserCreatedMatch(
              existingCategories,
              defaultCat
            );

            if (userCreatedMatch) {
              const catRef = doc(
                getUserCollectionRef("categories"),
                userCreatedMatch.id
              );
              batch.update(catRef, { defaultId: defaultCat.id });
              operationsFound = true;
              console.log(
                `Categoria "${userCreatedMatch.name}" adotada como "${defaultCat.name}".`
              );
            } else {
              const catRef = doc(getUserCollectionRef("categories"));
              // CORREÇÃO: Pegamos explicitamente apenas os campos que sabemos que existem.
              const { id, name, icon } = defaultCat;
              const catData = { name, icon }; // Criamos o objeto de dados para o Firestore.

              batch.set(catRef, {
                ...catData,
                uid: user.uid,
                defaultId: id, // Usamos o 'id' do objeto padrão
                createdAt: new Date(),
              });
              operationsFound = true;
              console.log(`Categoria padrão "${defaultCat.name}" criada.`);
            }
          });

          if (operationsFound) {
            console.log(
              "LOG 10: Operações de migração encontradas. Enviando para o Firestore..."
            );
            await batch.commit();
            console.log("LOG 11: Batch commit concluído com sucesso.");
          } else {
            console.log("LOG 10.1: Nenhuma operação de migração necessária.");
          }
        } catch (err) {
          console.error("ERRO FATAL DENTRO DO runDataCheck:", err);
          toast({
            title: "Erro de Sincronização",
            description: "Não foi possível verificar os dados padrão.",
            variant: "destructive",
          });
        } finally {
          // ESTE BLOCO SEMPRE EXECUTA, COM OU SEM ERRO.
          console.log(
            "LOG FINAL: runDataCheck finalizado. Sinalizando conclusão."
          );
          setDataSeedCheckCompleted(true); // <-- O SINAL VERDE!
        }
      };

      runDataCheck();
    }
    // ATENÇÃO: AQUI ESTÁ A CORREÇÃO PRINCIPAL PARA O LOOP
  }, [loadingFinanceData, user, projectId]);

  useEffect(() => {
    // Roda apenas se:
    // 1. O carregamento principal terminou.
    // 2. O usuário está logado.
    // 3. O array de dívidas (debts) não está vazio.
    if (!loadingFinanceData && user && projectId && debts.length > 0) {
      const updateDebtsWithoutCategory = async () => {
        // Pegamos apenas as dívidas que realmente não têm categoria.
        const debtsToUpdate = debts.filter((debt) => !debt.categoryId);

        if (debtsToUpdate.length === 0) {
          // Se não há nada para atualizar, não fazemos nada.
          return;
        }

        console.log(
          `Encontradas ${debtsToUpdate.length} dívidas sem categoria. Procurando categoria padrão...`
        );

        try {
          const db = getFirestore();
          const userCollection = `artifacts/${projectId}/users/${user.uid}`;

          // Busca a categoria "Outras Despesas" pelo seu ID padrão.
          const categoriesRef = collection(db, `${userCollection}/categories`);
          const q = query(
            categoriesRef,
            where("defaultId", "==", "default-outras-despesas")
          );
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            console.warn(
              "A categoria padrão 'Outras Despesas' não foi encontrada. As dívidas não serão atualizadas."
            );
            return;
          }

          const genericCategory = querySnapshot.docs[0];
          const genericCategoryId = genericCategory.id;

          console.log(
            `Categoria padrão encontrada (ID: ${genericCategoryId}). Iniciando atualização...`
          );

          // Cria um batch para atualizar todas as dívidas de uma vez.
          const batch = writeBatch(db);
          debtsToUpdate.forEach((debt) => {
            const debtRef = doc(db, `${userCollection}/debts`, debt.id);
            batch.update(debtRef, { categoryId: genericCategoryId });
          });

          await batch.commit();
          console.log(
            `${debtsToUpdate.length} dívidas foram atualizadas com a categoria padrão com sucesso.`
          );
        } catch (error) {
          console.error(
            "Erro ao tentar atualizar dívidas sem categoria:",
            error
          );
          toast({
            title: "Erro de Sincronização",
            description:
              "Não foi possível categorizar algumas dívidas antigas.",
            variant: "destructive",
          });
        }
      };

      updateDebtsWithoutCategory();
    }
    // Este useEffect depende diretamente do array 'debts'.
  }, [debts, loadingFinanceData, user, projectId, toast]);

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
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
