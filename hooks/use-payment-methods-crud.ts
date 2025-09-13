import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { PaymentMethod } from "@/interfaces/finance";
import { User as FirebaseUser } from "firebase/auth";

interface UsePaymentMethodsCrudProps {
  db: Firestore | null;
  user: FirebaseUser | null;
  projectId: string | null;
  setErrorFinanceData: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePaymentMethodsCrud = ({
  db,
  user,
  projectId,
  setErrorFinanceData,
}: UsePaymentMethodsCrudProps) => {
  const addPaymentMethod = async (
    method: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "isActive">
  ) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await addDoc(
        collection(
          db,
          `artifacts/${projectId}/users/${user.uid}/paymentMethods`
        ),
        {
          ...method,
          uid: user.uid,
          isActive: true,
          createdAt: serverTimestamp(),
        }
      );
      console.log(
        "usePaymentMethodsCrud: Forma de pagamento adicionada com sucesso."
      );
    } catch (error: unknown) {
      console.error(
        "usePaymentMethodsCrud: Erro ao adicionar forma de pagamento:",
        error
      );
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(
          `Erro ao adicionar forma de pagamento: ${error.message}`
        );
      }
      throw new Error(
        "Não foi possível adicionar a forma de pagamento. Tente novamente."
      );
    }
  };

  const updatePaymentMethod = async (
    methodId: string,
    data: Partial<Omit<PaymentMethod, "id" | "uid">>
  ) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      const docRef = doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/paymentMethods`,
        methodId
      );

      const cleanData = { ...data };

      if (cleanData.description === undefined) {
        cleanData.description = "";
      }

      await updateDoc(docRef, cleanData);

      console.log(
        "usePaymentMethodsCrud: Forma de pagamento atualizada com sucesso."
      );
    } catch (error: unknown) {
      console.error(
        "usePaymentMethodsCrud: Erro ao atualizar forma de pagamento:",
        error
      );
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(
          `Erro ao atualizar forma de pagamento: ${error.message}`
        );
      }
      throw new Error(
        "Não foi possível atualizar a forma de pagamento. Tente novamente."
      );
    }
  };

  const deletePaymentMethod = async (methodId: string) => {
    if (!db || !user || !projectId) {
      setErrorFinanceData("Firestore não inicializado ou usuário não logado.");
      return;
    }
    try {
      await deleteDoc(
        doc(
          db,
          `artifacts/${projectId}/users/${user.uid}/paymentMethods`,
          methodId
        )
      );
      console.log(
        "usePaymentMethodsCrud: Forma de pagamento deletada com sucesso."
      );
    } catch (error: unknown) {
      console.error(
        "usePaymentMethodsCrud: Erro ao deletar forma de pagamento:",
        error
      );
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorFinanceData(
          `Erro ao deletar forma de pagamento: ${error.message}`
        );
      }
      throw new Error(
        "Não foi possível remover a forma de pagamento. Tente novamente."
      );
    }
  };

  return { addPaymentMethod, updatePaymentMethod, deletePaymentMethod };
};
