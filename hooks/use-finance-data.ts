import { useEffect } from "react";
import { Firestore, collection, query, onSnapshot } from "firebase/firestore";
import {
  Account,
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
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setDebtInstallments: React.Dispatch<React.SetStateAction<DebtInstallment[]>>;
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  setDebtTypes: React.Dispatch<React.SetStateAction<DebtType[]>>;
}

export const useFinanceData = ({
  db,
  user,
  projectId,
  setAccounts,
  setTransactions,
  setDebts,
  setDebtInstallments,
  setPaymentMethods,
  setDebtTypes,
}: UseFinanceDataProps) => {
  useEffect(() => {
    let unsubscribeAccounts: () => void = () => {};
    let unsubscribeTransactions: () => void = () => {};
    let unsubscribeDebts: () => void = () => {};
    let unsubscribeDebtInstallments: () => void = () => {};
    let unsubscribePaymentMethods: () => void = () => {};
    let unsubscribeDebtTypes: () => void = () => {};

    if (user && db && projectId) {
      console.log(
        "useFinanceData: Usuário logado e Firestore pronto. Configurando listeners..."
      );

      const getUserCollectionRef = (collectionName: string) =>
        collection(
          db,
          `artifacts/${projectId}/users/${user.uid}/${collectionName}`
        );

      unsubscribeAccounts = onSnapshot(
        query(getUserCollectionRef("accounts")),
        (snapshot) => {
          const fetchedAccounts: Account[] = [];
          snapshot.forEach((doc) => {
            fetchedAccounts.push({ id: doc.id, ...doc.data() } as Account);
          });
          setAccounts(fetchedAccounts);
          console.log("useFinanceData: Contas carregadas.");
        },
        (error) => {
          console.error("useFinanceData: Erro ao carregar contas:", error);
        }
      );

      unsubscribeTransactions = onSnapshot(
        query(getUserCollectionRef("transactions")),
        (snapshot) => {
          const fetchedTransactions: Transaction[] = [];
          snapshot.forEach((doc) => {
            fetchedTransactions.push({
              id: doc.id,
              ...doc.data(),
            } as Transaction);
          });
          fetchedTransactions.sort((a, b) => {
            const dateA = a.createdAt?.toDate
              ? a.createdAt.toDate().getTime()
              : new Date(a.date).getTime();
            const dateB = b.createdAt?.toDate
              ? b.createdAt.toDate().getTime()
              : new Date(b.date).getTime();
            return dateB - dateA;
          });
          setTransactions(fetchedTransactions);
          console.log("useFinanceData: Transações carregadas.");
        },
        (error) => {
          console.error("useFinanceData: Erro ao carregar transações:", error);
        }
      );

      unsubscribeDebts = onSnapshot(
        query(getUserCollectionRef("debts")),
        (snapshot) => {
          const fetchedDebts: Debt[] = [];
          snapshot.forEach((doc) => {
            fetchedDebts.push({ id: doc.id, ...doc.data() } as Debt);
          });
          setDebts(fetchedDebts);
          console.log("useFinanceData: Dívidas carregadas.");
        },
        (error) => {
          console.error("useFinanceData: Erro ao carregar dívidas:", error);
        }
      );

      unsubscribeDebtInstallments = onSnapshot(
        query(getUserCollectionRef("debtInstallments")),
        (snapshot) => {
          const fetchedInstallments: DebtInstallment[] = [];
          snapshot.forEach((doc) => {
            fetchedInstallments.push({
              id: doc.id,
              ...doc.data(),
            } as DebtInstallment);
          });
          fetchedInstallments.sort(
            (a, b) =>
              new Date(a.expectedDueDate).getTime() -
              new Date(b.expectedDueDate).getTime()
          );
          setDebtInstallments(fetchedInstallments);
          console.log("useFinanceData: Parcelas de dívidas carregadas.");
        },
        (error) => {
          console.error(
            "useFinanceData: Erro ao carregar parcelas de dívidas:",
            error
          );
        }
      );

      unsubscribePaymentMethods = onSnapshot(
        query(getUserCollectionRef("paymentMethods")),
        (snapshot) => {
          const fetchedPaymentMethods: PaymentMethod[] = [];
          snapshot.forEach((doc) => {
            fetchedPaymentMethods.push({
              id: doc.id,
              ...doc.data(),
            } as PaymentMethod);
          });
          setPaymentMethods(fetchedPaymentMethods);
          console.log("useFinanceData: Formas de pagamento carregadas.");
        },
        (error) => {
          console.error(
            "useFinanceData: Erro ao carregar formas de pagamento:",
            error
          );
        }
      );

      unsubscribeDebtTypes = onSnapshot(
        query(getUserCollectionRef("debtTypes")),
        (snapshot) => {
          const fetchedDebtTypes: DebtType[] = [];
          snapshot.forEach((doc) => {
            fetchedDebtTypes.push({ id: doc.id, ...doc.data() } as DebtType);
          });
          setDebtTypes(fetchedDebtTypes);
          console.log("useFinanceData: Tipos de dívida carregados.");
        },
        (error) => {
          console.error(
            "useFinanceData: Erro ao carregar tipos de dívida:",
            error
          );
        }
      );

      return () => {
        console.log("useFinanceData: Limpando todos os listeners de dados.");
        unsubscribeAccounts();
        unsubscribeTransactions();
        unsubscribeDebts();
        unsubscribeDebtInstallments();
        unsubscribePaymentMethods();
        unsubscribeDebtTypes();
      };
    } else {
      setAccounts([]);
      setTransactions([]);
      setDebts([]);
      setDebtInstallments([]);
      setPaymentMethods([]);
      setDebtTypes([]);
    }
  }, [db, user, projectId]);
};
