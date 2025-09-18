// hooks/use-app-flow.ts
import { useState, useEffect } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";

// Defina a versão atual do seu release aqui
const CURRENT_RELEASE_VERSION = "v1.1.0-category-types";

export const useAppFlow = () => {
  const { user, projectId } = useAuth();
  const { categories, loadingFinanceData } = useFinance();

  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCategoryMigration, setShowCategoryMigration] = useState(false);

  const [untaggedCategories, setUntaggedCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loadingFinanceData || !user || !projectId) return;

    const checkFlow = async () => {
      setIsLoading(true);

      const db = getFirestore();
      const settingsRef = doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/profile`,
        "settings"
      );
      const settingsSnap = await getDoc(settingsRef);
      const settingsData = settingsSnap.data() || {};

      if (settingsData.lastReleaseNotesSeen !== CURRENT_RELEASE_VERSION) {
        setShowReleaseNotes(true);
        setIsLoading(false);
        return;
      }

      const categoriesToTag = categories.filter((cat) => !cat.type);
      if (
        categoriesToTag.length > 0 &&
        !settingsData.categoryTypeMigrationCompleted
      ) {
        setUntaggedCategories(categoriesToTag);
        setShowCategoryMigration(true);
      }

      setIsLoading(false);
    };

    checkFlow();
  }, [loadingFinanceData, user, projectId, categories]);

  return {
    isLoading,
    showReleaseNotes,
    setShowReleaseNotes,
    showCategoryMigration,
    setShowCategoryMigration,
    untaggedCategories,
    CURRENT_RELEASE_VERSION,
  };
};
