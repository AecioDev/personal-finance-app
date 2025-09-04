import { useEffect, useState, useRef } from "react";
import {
  Firestore,
  collection,
  query,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  Account,
  Category,
  Transaction,
  Debt,
  DebtInstallment,
  PaymentMethod,
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
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

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
  setLoading,
}: UseFinanceDataProps) => {
  const initialFetchCounter = useRef(0);
  const totalListeners = 7;

  useEffect(() => {
    if (!user || !db || !projectId) {
      setLoading(false);
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setDebts([]);
      setDebtInstallments([]);
      setPaymentMethods([]);
      return;
    }

    setLoading(true);
    initialFetchCounter.current = 0;

    const listenersUnsubscribed: (() => void)[] = [];
    const collections: (keyof Omit<
      UseFinanceDataProps,
      "db" | "user" | "projectId" | "setLoading"
    >)[] = [
      "setAccounts",
      "setCategories",
      "setTransactions",
      "setDebts",
      "setDebtInstallments",
      "setPaymentMethods",
    ];

    const setters: { [key: string]: Function } = {
      setAccounts,
      setCategories,
      setTransactions,
      setDebts,
      setDebtInstallments,
      setPaymentMethods,
    };

    const collectionNames: { [key: string]: string } = {
      setAccounts: "accounts",
      setCategories: "categories",
      setTransactions: "transactions",
      setDebts: "debts",
      setDebtInstallments: "debtInstallments",
      setPaymentMethods: "paymentMethods",
    };

    const handleInitialFetch = () => {
      initialFetchCounter.current += 1;
      if (initialFetchCounter.current === totalListeners) {
        setLoading(false);
      }
    };

    collections.forEach((setterKey) => {
      const collectionName = collectionNames[setterKey];
      const setter = setters[setterKey];

      const q = query(
        collection(
          db,
          `artifacts/${projectId}/users/${user.uid}/${collectionName}`
        )
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const isInitialLoad =
            snapshot.metadata.fromCache === false &&
            initialFetchCounter.current < totalListeners;

          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertTimestampsToDates(doc.data()),
          }));
          setter(data);

          if (isInitialLoad) {
            handleInitialFetch();
          }
        },
        (error) => {
          console.error(`Error fetching ${collectionName}: `, error);
          handleInitialFetch();
        }
      );
      listenersUnsubscribed.push(unsubscribe);
    });

    return () => {
      listenersUnsubscribed.forEach((unsubscribe) => unsubscribe());
    };
  }, [db, user, projectId]);
};
