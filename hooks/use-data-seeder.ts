import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useFinance } from "@/components/providers/finance-provider";
import {
  getFirestore,
  writeBatch,
  collection,
  doc,
  getDocs,
} from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import {
  defaultCategories,
  defaultPaymentMethods,
  defaultAccount,
} from "@/lib/data/defaults";
import { Category, PaymentMethod } from "@/interfaces/finance";

export const useDataSeeder = () => {
  const { user, projectId } = useAuth();
  // Ainda usamos os dados do context para a parte de atualização das dívidas
  const { debts } = useFinance();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDataCheck = async () => {
    if (!user || !projectId) {
      toast({
        title: "Erro de Autenticação",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const db = getFirestore();
      const batch = writeBatch(db);

      const getUserCollectionRef = (collectionName: string) =>
        collection(
          db,
          `artifacts/${projectId}/users/${user.uid}/${collectionName}`
        );

      // --- BUSCA OS DADOS ATUAIS DIRETAMENTE DO FIREBASE ---
      const accountsSnap = await getDocs(getUserCollectionRef("accounts"));
      const categoriesSnap = await getDocs(getUserCollectionRef("categories"));
      const paymentMethodsSnap = await getDocs(
        getUserCollectionRef("paymentMethods")
      );

      const existingAccounts = accountsSnap.docs.map((doc) => doc.data());
      const existingCategories = categoriesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Category)
      );
      const existingPaymentMethods = paymentMethodsSnap.docs.map(
        (doc) => doc.data() as PaymentMethod
      );

      let createdSomething = false;

      // 1. Verifica e cria a Conta Padrão
      if (existingAccounts.length === 0) {
        const accountRef = doc(getUserCollectionRef("accounts"));
        batch.set(accountRef, { ...defaultAccount, uid: user.uid });
        console.log("Criando conta padrão 'Carteira'...");
        createdSomething = true;
      }

      // 2. Verifica e cria Formas de Pagamento Faltantes
      const existingPMNames = new Set(
        existingPaymentMethods.map((pm) => pm.name)
      );
      defaultPaymentMethods.forEach((pm) => {
        if (!existingPMNames.has(pm.name)) {
          const pmRef = doc(getUserCollectionRef("paymentMethods"));
          batch.set(pmRef, { ...pm, uid: user.uid, isActive: true });
          console.log(`Criando forma de pagamento padrão: ${pm.name}`);
          createdSomething = true;
        }
      });

      // 3. Verifica e cria Categorias Faltantes
      const existingCategoryNames = new Set(
        existingCategories.map((c) => c.name)
      );
      defaultCategories.forEach((cat) => {
        if (!existingCategoryNames.has(cat.name)) {
          const catRef = doc(getUserCollectionRef("categories"));
          batch.set(catRef, { ...cat, uid: user.uid });
          console.log(`Criando categoria padrão: ${cat.name}`);
          createdSomething = true;
        }
      });

      if (createdSomething) {
        await batch.commit(); // Só comita se tiver algo a ser criado
      }

      // 4. Atualiza Dívidas sem categoria
      const debtsToUpdate = debts.filter((debt) => !debt.categoryId);
      if (debtsToUpdate.length > 0) {
        // A categoria pode ter sido acabada de criar, então buscamos a referência dela
        const allCategories = [...existingCategories];
        if (createdSomething) {
          // Se criamos algo, é mais seguro re-buscar, mas para simplicidade vamos assumir que está ok.
        }
        const genericCategory = allCategories.find(
          (c) => c.name === "Outras Despesas"
        );
        const genericCategoryId = genericCategory?.id;

        if (genericCategoryId) {
          const debtBatch = writeBatch(db);
          console.log(
            `Atualizando ${debtsToUpdate.length} dívidas sem categoria...`
          );
          debtsToUpdate.forEach((debt) => {
            const debtRef = doc(
              db,
              `artifacts/${projectId}/users/${user.uid}/debts`,
              debt.id
            );
            debtBatch.update(debtRef, { categoryId: genericCategoryId });
          });
          await debtBatch.commit();
        }
      }

      toast({
        title: "Verificação Concluída",
        description: "Seus dados foram atualizados com sucesso.",
      });
    } catch (err: any) {
      console.error("Erro ao verificar e atualizar dados:", err);
      setError("Ocorreu um erro ao atualizar seus dados.");
      toast({
        title: "Erro na Atualização",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return { runDataCheck, isChecking, error };
};
