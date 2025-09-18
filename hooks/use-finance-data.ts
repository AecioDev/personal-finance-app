// in: hooks/use-finance-data.ts (VERSÃO FINAL E ROBUSTA)

import { useEffect } from "react";
import {
  Firestore,
  collection,
  query,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { Account, Category, PaymentMethod } from "@/interfaces/finance";
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

type SetterMap = Pick<
  UseFinanceDataProps,
  "setAccounts" | "setCategories" | "setPaymentMethods" | "setFinancialEntries"
>;

const convertTimestampsToDates = <T extends Record<string, any>>(
  data: T
): T => {
  if (typeof data !== "object" || data === null) return data;
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
  useEffect(() => {
    if (!db || !user || !projectId) {
      // Se não houver usuário, garantimos que o loading termine para mostrar a tela de login.
      if (!user) setLoading(false);
      return;
    }

    setLoading(true);

    const listenersUnsubscribed: (() => void)[] = [];

    const setters: SetterMap = {
      setAccounts,
      setCategories,
      setPaymentMethods,
      setFinancialEntries,
    };

    const collectionNames: { [key: string]: string } = {
      setAccounts: "accounts",
      setCategories: "categories",
      setPaymentMethods: "paymentMethods",
      setFinancialEntries: "financial-entries",
    };

    // ✅ LÓGICA DE CARREGAMENTO SIMPLIFICADA
    // Usamos um objeto para rastrear o status de carregamento de cada coleção.
    const loadingStatus: Record<string, boolean> = {
      accounts: true,
      categories: true,
      paymentMethods: true,
      "financial-entries": true,
    };

    const checkAllLoaded = () => {
      // Se algum valor em `loadingStatus` ainda for `true`, não faz nada.
      if (Object.values(loadingStatus).some((status) => status === true)) {
        return;
      }
      // Se todos forem `false`, o carregamento inicial terminou!
      setLoading(false);
      console.log("[useFinanceData] Todos os dados foram carregados.");
    };

    Object.keys(setters).forEach((setterKey) => {
      const collectionName = collectionNames[setterKey];
      const setter = setters[setterKey as keyof SetterMap];

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

          // Na primeira vez que o snapshot responder, marcamos esta coleção como carregada.
          if (loadingStatus[collectionName]) {
            loadingStatus[collectionName] = false;
            checkAllLoaded(); // E verificamos se todas as outras já terminaram.
          }
        },
        (error) => {
          console.error(`Error fetching ${collectionName}: `, error);
          // Se der erro, consideramos "carregado" para não prender o app.
          if (loadingStatus[collectionName]) {
            loadingStatus[collectionName] = false;
            checkAllLoaded();
          }
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
