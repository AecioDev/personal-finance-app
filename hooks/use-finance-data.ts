import { useEffect } from "react";
import {
  Firestore,
  collection,
  query,
  onSnapshot,
  Timestamp, // 1. Importa o tipo Timestamp
} from "firebase/firestore";
import {
  Account,
  Category,
  Transaction,
  Debt,
  DebtInstallment,
  PaymentMethod,
  DebtType,
} from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";

interface UseFinanceDataProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setDebtInstallments: React.Dispatch<React.SetStateAction<DebtInstallment[]>>;
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  setDebtTypes: React.Dispatch<React.SetStateAction<DebtType[]>>;
}

// 2. Função auxiliar para converter Timestamps em Dates
const convertTimestampsToDates = (data: any) => {
  const convertedData = { ...data };
  for (const key in convertedData) {
    if (convertedData[key] instanceof Timestamp) {
      convertedData[key] = convertedData[key].toDate();
    }
  }
  return convertedData;
};

export const useFinanceData = ({
  db,
  user,
  projectId,
  setAccounts,
  setCategories,
  setTransactions,
  setDebts,
  setDebtInstallments,
  setPaymentMethods,
  setDebtTypes,
}: UseFinanceDataProps) => {
  useEffect(() => {
    let unsubscribeAccounts: () => void = () => {};
    let unsubscribeCategories: () => void = () => {};
    let unsubscribeTransactions: () => void = () => {};
    let unsubscribeDebts: () => void = () => {};
    let unsubscribeDebtInstallments: () => void = () => {};
    let unsubscribePaymentMethods: () => void = () => {};
    let unsubscribeDebtTypes: () => void = () => {};

    if (user && db && projectId) {
      const getUserCollectionRef = (collectionName: string) =>
        collection(
          db,
          `artifacts/${projectId}/users/${user.uid}/${collectionName}`
        );

      unsubscribeAccounts = onSnapshot(
        query(getUserCollectionRef("accounts")),
        (snapshot) => {
          const fetchedAccounts: Account[] = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Account)
          );
          setAccounts(fetchedAccounts);
        }
      );

      unsubscribeCategories = onSnapshot(
        query(getUserCollectionRef("categories")),
        (snapshot) => {
          const fetchedCategories: Category[] = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...convertTimestampsToDates(doc.data()),
              } as Category)
          );
          setCategories(fetchedCategories);
        }
      );

      unsubscribeTransactions = onSnapshot(
        query(getUserCollectionRef("transactions")),
        (snapshot) => {
          const fetchedTransactions: Transaction[] = [];
          snapshot.forEach((doc) => {
            // 3. Aplica a conversão aqui
            const convertedData = convertTimestampsToDates(doc.data());
            fetchedTransactions.push({
              id: doc.id,
              ...convertedData,
            } as Transaction);
          });
          fetchedTransactions.sort((a, b) => {
            // 4. Agora podemos usar .getTime() com segurança
            const dateA = a.createdAt?.getTime() ?? a.date.getTime();
            const dateB = b.createdAt?.getTime() ?? b.date.getTime();
            return dateB - dateA;
          });
          setTransactions(fetchedTransactions);
        }
      );

      unsubscribeDebts = onSnapshot(
        query(getUserCollectionRef("debts")),
        (snapshot) => {
          const fetchedDebts: Debt[] = [];
          snapshot.forEach((doc) => {
            // 3. Aplica a conversão aqui
            const convertedData = convertTimestampsToDates(doc.data());
            fetchedDebts.push({ id: doc.id, ...convertedData } as Debt);
          });
          setDebts(fetchedDebts);
        }
      );

      unsubscribeDebtInstallments = onSnapshot(
        query(getUserCollectionRef("debtInstallments")),
        (snapshot) => {
          const fetchedInstallments: DebtInstallment[] = [];
          snapshot.forEach((doc) => {
            // 3. Aplica a conversão aqui
            const convertedData = convertTimestampsToDates(doc.data());
            fetchedInstallments.push({
              id: doc.id,
              ...convertedData,
            } as DebtInstallment);
          });
          fetchedInstallments.sort(
            // 4. Agora podemos usar .getTime() com segurança
            (a, b) => a.expectedDueDate.getTime() - b.expectedDueDate.getTime()
          );
          setDebtInstallments(fetchedInstallments);
        }
      );

      unsubscribePaymentMethods = onSnapshot(
        query(getUserCollectionRef("paymentMethods")),
        (snapshot) => {
          const fetchedPaymentMethods: PaymentMethod[] = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as PaymentMethod)
          );
          setPaymentMethods(fetchedPaymentMethods);
        }
      );

      unsubscribeDebtTypes = onSnapshot(
        query(getUserCollectionRef("debtTypes")),
        (snapshot) => {
          const fetchedDebtTypes: DebtType[] = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as DebtType)
          );
          setDebtTypes(fetchedDebtTypes);
        }
      );

      return () => {
        unsubscribeAccounts();
        unsubscribeCategories();
        unsubscribeTransactions();
        unsubscribeDebts();
        unsubscribeDebtInstallments();
        unsubscribePaymentMethods();
        unsubscribeDebtTypes();
      };
    } else {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setDebts([]);
      setDebtInstallments([]);
      setPaymentMethods([]);
      setDebtTypes([]);
    }
  }, [db, user, projectId]);
};
