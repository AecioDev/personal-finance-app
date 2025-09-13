// in: hooks/use-finance-data.ts

import { useEffect, useRef } from "react";
import {
  Firestore,
  collection,
  query,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { Account, Category, PaymentMethod } from "@/interfaces/finance"; // Removido Debt, etc.
import { FinancialEntry } from "@/interfaces/financial-entry";
import { User as FirebaseUser } from "firebase/auth";

interface UseFinanceDataProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  refreshTrigger: number;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  setFinancialEntries: React.Dispatch<React.SetStateAction<FinancialEntry[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// Este tipo "pega" apenas os setters da interface principal
type SetterMap = Pick<
  UseFinanceDataProps,
  "setAccounts" | "setCategories" | "setPaymentMethods" | "setFinancialEntries"
>;

const convertTimestampsToDates = <T extends Record<string, any>>(
  data: T
): T => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const convertedData: Record<string, any> = { ...data };

  for (const key in convertedData) {
    const value = convertedData[key];
    if (value instanceof Timestamp) {
      convertedData[key] = value.toDate();
    }
  }

  return convertedData as T;
};

export const useFinanceData = ({
  db,
  user,
  projectId,
  refreshTrigger,
  setAccounts,
  setCategories,
  setPaymentMethods,
  setFinancialEntries,
  setLoading,
}: UseFinanceDataProps) => {
  const initialFetchCounter = useRef(0);

  useEffect(() => {
    if (!db || !user || !projectId) return;

    setLoading(true);
    initialFetchCounter.current = 0;

    const listenersUnsubscribed: (() => void)[] = [];

    const setters: SetterMap = {
      setAccounts,
      setCategories,
      setPaymentMethods,
      setFinancialEntries,
    };

    const collections = Object.keys(setters) as (keyof typeof setters)[];
    const totalListeners = collections.length;

    const collectionNames: { [key: string]: string } = {
      setAccounts: "accounts",
      setCategories: "categories",
      setPaymentMethods: "paymentMethods",
      setFinancialEntries: "financial-entries",
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
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertTimestampsToDates(doc.data()),
          }));
          setter(data as any);

          if (initialFetchCounter.current < totalListeners) {
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
  }, [
    db,
    user,
    projectId,
    refreshTrigger,
    setAccounts,
    setCategories,
    setPaymentMethods,
    setFinancialEntries,
    setLoading,
  ]);
};
