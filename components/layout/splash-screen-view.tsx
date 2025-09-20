// components/layout/splash-screen-view.tsx (VERSÃO FINAL COM TUDO INTEGRADO)
"use client";

import { useEffect, useState, ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppFlow } from "@/hooks/use-app-flow";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { releaseNotes } from "@/lib/release-notes";
import { useAuth } from "@/components/providers/auth-provider";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { Icon } from "@iconify/react";
import { CategoryTypeMigrationDialog } from "../categories/category-type-migration-dialog";
import { AppLoader } from "./app-loader";

// Componente para o loader com a barra de progresso animada
const AnimatedLoader = ({
  onAnimationComplete,
}: {
  onAnimationComplete: () => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const loadingMessages = [
    "Aquecendo as calculadoras...",
    "Limpando a poeira dos extratos...",
    "Consultando o guru das finanças...",
    "Aplicando juros compostos na diversão...",
    "Quase lá! Contando os centavos...",
  ];

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 1200);
    const progressTimer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(progressTimer);
          setTimeout(onAnimationComplete, 100);
          return 100;
        }
        return prevProgress + 1;
      });
    }, 50);
    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="relative flex flex-col justify-center items-center h-screen bg-background text-foreground p-8 overflow-hidden">
      <Image
        src="/Logo_SF.png"
        alt="Logo do aplicativo"
        width={512}
        height={512}
        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 object-contain opacity-40"
        priority
      />
      <div className="relative flex flex-col items-center mt-28">
        <div className="w-full max-w-sm text-center">
          <p className="text-lg text-muted-foreground mb-4 h-6">
            {loadingMessages[messageIndex]}
          </p>
          <Progress value={progress} className="w-full" />
        </div>
      </div>
      <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
        <p>Sabia que você pode desativar esta animação no seu Perfil?</p>
      </footer>
    </div>
  );
};

// Componente para a tela de notas de release
const ReleaseNotesContent = ({
  version,
  onConfirm,
  isMigrationRequired,
}: {
  version: string;
  onConfirm: () => void;
  isMigrationRequired: boolean;
}): ReactNode => {
  const note = releaseNotes[version];
  if (!note) return null;
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background text-foreground p-6 md:p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {note.title}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          {note.description}
        </p>
        <div className="my-8 space-y-4">
          <p className="font-semibold text-foreground">Últimas modificações:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {note.changes.map((change, index) => (
              <li key={index}>
                <span className="font-semibold text-foreground">
                  {change.title}:
                </span>{" "}
                {change.detail}
              </li>
            ))}
          </ul>
          {isMigrationRequired && (
            <p className="pt-4 text-accent font-semibold">
              Na próxima tela, vamos te ajudar a organizar suas categorias
              atuais. Leva só um minutinho!
            </p>
          )}
        </div>
        <div className="flex justify-end mt-8">
          <Button onClick={onConfirm} size="lg">
            Continuar
            <Icon icon="fa6-solid:angles-right" className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente para a tela de instalação iOS
const IosInstallPromptContent = ({ onConfirm }: { onConfirm: () => void }) => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background text-foreground p-6 md:p-8">
      <div className="max-w-md w-full text-center">
        <Icon
          icon="mdi:apple-ios"
          className="h-16 w-16 mx-auto text-foreground mb-4"
        />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Instale o App no seu Dispositivo
        </h1>
        <p className="text-muted-foreground mb-6">
          Para uma melhor experiência, adicione um atalho do nosso app na sua
          tela de início.
        </p>
        <div className="text-left space-y-4">
          <p>
            1. Toque no ícone de <strong>Compartilhar</strong>{" "}
            <Icon
              icon="mdi:export-variant"
              className="inline-block h-5 w-5 mx-1"
            />{" "}
            no Safari.
          </p>
          <p>
            2. Procure e toque na opção{" "}
            <strong>"Adicionar à Tela de Início"</strong>.
          </p>
        </div>

        {/* ✅ AVISO ADICIONADO */}
        <p className="text-xs text-muted-foreground mt-6">
          Caso queira fazer isso depois, você pode encontrar este passo a passo
          no seu Perfil.
        </p>

        <div className="flex justify-center mt-4">
          <Button onClick={onConfirm} size="lg">
            Ok, entendi!
          </Button>
        </div>
      </div>
    </div>
  );
};

// O componente principal da Splash Screen que orquestra tudo
export function SplashScreenView() {
  const router = useRouter();
  const { user, projectId } = useAuth();
  const {
    isLoading,
    isAnimationEnabled,
    showReleaseNotes,
    showCategoryMigration,
    showIosInstallPrompt,
    untaggedCategories,
    CURRENT_RELEASE_VERSION,
  } = useAppFlow();

  const [step, setStep] = useState<
    | "animating"
    | "showing_release"
    | "showing_migration"
    | "showing_ios_prompt"
    | "redirecting"
  >("animating");

  // useEffect para decidir o próximo passo após o carregamento dos dados
  useEffect(() => {
    if (isLoading) return;

    const decideNextStep = () => {
      if (showReleaseNotes) return setStep("showing_release");
      if (showCategoryMigration) return setStep("showing_migration");
      if (showIosInstallPrompt) return setStep("showing_ios_prompt");
      setStep("redirecting");
    };

    if (!isAnimationEnabled) {
      decideNextStep();
    }
  }, [
    isLoading,
    isAnimationEnabled,
    showReleaseNotes,
    showCategoryMigration,
    showIosInstallPrompt,
  ]);

  const handleAnimationComplete = () => {
    if (showReleaseNotes) {
      setStep("showing_release");
    } else if (showCategoryMigration) {
      setStep("showing_migration");
    } else if (showIosInstallPrompt) {
      setStep("showing_ios_prompt");
    } else {
      setStep("redirecting");
    }
  };

  // useEffect para o redirecionamento final
  useEffect(() => {
    if (step === "redirecting") {
      router.replace("/dashboard");
    }
  }, [step, router]);

  const handleConfirmReleaseNotes = async () => {
    if (!user || !projectId) return;
    const db = getFirestore();
    const settingsRef = doc(
      db,
      `artifacts/${projectId}/users/${user.uid}/profile`,
      "settings"
    );
    try {
      await setDoc(
        settingsRef,
        { lastReleaseNotesSeen: CURRENT_RELEASE_VERSION },
        { merge: true }
      );
    } finally {
      if (showCategoryMigration) {
        setStep("showing_migration");
      } else if (showIosInstallPrompt) {
        setStep("showing_ios_prompt");
      } else {
        setStep("redirecting");
      }
    }
  };

  const handleMigrationClose = () => {
    if (showIosInstallPrompt) {
      setStep("showing_ios_prompt");
    } else {
      setStep("redirecting");
    }
  };

  const handleIosPromptConfirm = async () => {
    if (!user || !projectId) return;
    const db = getFirestore();
    const settingsRef = doc(
      db,
      `artifacts/${projectId}/users/${user.uid}/profile`,
      "settings"
    );
    try {
      await setDoc(
        settingsRef,
        { hasSeenIosInstallPrompt: true },
        { merge: true }
      );
    } finally {
      setStep("redirecting");
    }
  };

  // --- RENDERIZAÇÃO ---

  if (step === "showing_release") {
    return (
      <ReleaseNotesContent
        version={CURRENT_RELEASE_VERSION}
        onConfirm={handleConfirmReleaseNotes}
        isMigrationRequired={showCategoryMigration}
      />
    );
  }
  if (step === "showing_migration") {
    return (
      <div className="h-screen bg-background">
        <CategoryTypeMigrationDialog
          isOpen={true}
          onClose={handleMigrationClose}
          categories={untaggedCategories}
        />
      </div>
    );
  }
  if (step === "showing_ios_prompt") {
    return <IosInstallPromptContent onConfirm={handleIosPromptConfirm} />;
  }

  if (isAnimationEnabled) {
    return <AnimatedLoader onAnimationComplete={handleAnimationComplete} />;
  }

  return <AppLoader text="Carregando..." />;
}
