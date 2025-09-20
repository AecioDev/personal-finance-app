// hooks/use-app-flow.ts (VERSÃO FINAL E COMPLETA COM TODAS AS VERIFICAÇÕES)
import { useState, useEffect } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { APP_VERSION } from "@/lib/constants";

export const useAppFlow = () => {
  const { user, projectId } = useAuth();
  const { categories, loadingFinanceData } = useFinance();

  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCategoryMigration, setShowCategoryMigration] = useState(false);
  const [showIosInstallPrompt, setShowIosInstallPrompt] = useState(false);
  const [untaggedCategories, setUntaggedCategories] = useState<any[]>([]);
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);

  useEffect(() => {
    if (loadingFinanceData || !user || !projectId) return;

    const checkSettings = async () => {
      const db = getFirestore();
      const settingsRef = doc(
        db,
        `artifacts/${projectId}/users/${user.uid}/profile`,
        "settings"
      );
      const settingsSnap = await getDoc(settingsRef);
      const settingsData = settingsSnap.data() || {};

      // 1. Onboarding é a primeira barreira. Se não passou, não faz mais nada.
      if (!settingsData.onboardingCompleted) {
        return;
      }

      // 2. Lemos a preferência de animação do usuário.
      setIsAnimationEnabled(settingsData.showSplashScreenAnimation ?? true);

      // 3. Verificamos se é iOS e se precisa mostrar o aviso de PWA.
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isInStandaloneMode =
        "standalone" in window.navigator &&
        (window.navigator as any).standalone;
      if (
        isIOS &&
        !isInStandaloneMode &&
        !settingsData.hasSeenIosInstallPrompt
      ) {
        setShowIosInstallPrompt(true);
      }

      // 4. Verificamos se precisa mostrar as notas de release.
      if (settingsData.lastReleaseNotesSeen !== APP_VERSION) {
        setShowReleaseNotes(true);
      }

      // 5. Verificamos se precisa fazer a migração de categorias.
      const categoriesToTag = categories.filter((cat) => !cat.type);
      if (
        categoriesToTag.length > 0 &&
        !settingsData.categoryTypeMigrationCompleted
      ) {
        setUntaggedCategories(categoriesToTag);
        setShowCategoryMigration(true);
      }
    };

    checkSettings();
  }, [loadingFinanceData, user, projectId, categories]);

  return {
    isLoading: loadingFinanceData,
    showReleaseNotes,
    showCategoryMigration,
    showIosInstallPrompt,
    untaggedCategories,
    isAnimationEnabled,
    CURRENT_RELEASE_VERSION: APP_VERSION,
  };
};
