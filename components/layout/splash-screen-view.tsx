// components/layout/splash-screen-view.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppFlow } from "@/hooks/use-app-flow";
import { ReleaseNotesDialog } from "@/components/common/release-notes-dialog";
import { CategoryTypeMigrationDialog } from "@/components/categories/category-type-migration-dialog";
import { Icon } from "@iconify/react";

export function SplashScreenView() {
  const router = useRouter();
  const {
    isLoading,
    showReleaseNotes,
    setShowReleaseNotes,
    showCategoryMigration,
    setShowCategoryMigration,
    untaggedCategories,
    CURRENT_RELEASE_VERSION,
  } = useAppFlow();

  // Efeito que redireciona o usuário quando tudo estiver pronto
  useEffect(() => {
    // Se não está carregando e não tem nenhuma tela pra mostrar, manda pro dashboard.
    if (!isLoading && !showReleaseNotes && !showCategoryMigration) {
      router.replace("/dashboard");
    }
  }, [isLoading, showReleaseNotes, showCategoryMigration, router]);

  // Enquanto o hook verifica tudo, mostramos uma tela de carregamento bonita
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background text-foreground">
        <Icon icon="eos-icons:loading" className="h-12 w-12 text-primary" />
        <p className="mt-4 text-muted-foreground">
          Verificando tudo para você...
        </p>
      </div>
    );
  }

  // Se precisar mostrar os dialogs, a tela de splash fica "parada",
  // apenas renderizando os modais por cima de um fundo.
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background">
      {/* O conteúdo da tela de splash pode ficar aqui, mas o foco são os dialogs */}

      <ReleaseNotesDialog
        isOpen={showReleaseNotes}
        onClose={() => setShowReleaseNotes(false)}
        version={CURRENT_RELEASE_VERSION}
      />
      <CategoryTypeMigrationDialog
        isOpen={showCategoryMigration}
        onClose={() => setShowCategoryMigration(false)}
        categories={untaggedCategories}
      />
    </div>
  );
}
