// components/layout/splash-screen-view.tsx (VERSÃO FINAL COMPLETA COM FLUXO LINEAR)
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

// O componente principal da Splash Screen que orquestra tudo
export function SplashScreenView() {
  const router = useRouter();
  const { user, projectId } = useAuth();
  const {
    isLoading,
    showReleaseNotes,
    showCategoryMigration,
    isAnimationEnabled,
    CURRENT_RELEASE_VERSION,
    untaggedCategories,
  } = useAppFlow();

  const [step, setStep] = useState<
    "animating" | "showing_release" | "showing_migration" | "redirecting"
  >("animating");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const loadingMessages = [
    "Limpando a poeira dos extratos...",
    "Consultando o guru das finanças...",
    "Aplicando juros compostos na diversão...",
    "Quase lá! Contando os centavos...",
  ];

  // useEffect para a animação
  useEffect(() => {
    if (!isAnimationEnabled) {
      if (showReleaseNotes) {
        setStep("showing_release");
      } else if (showCategoryMigration) {
        setStep("showing_migration");
      } else {
        setStep("redirecting");
      }
      return;
    }

    // A animação só roda se estivermos no passo 'animating'
    if (step !== "animating" || isLoading) return;

    let messageIndex = 0;
    const messageTimer = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setMessage(loadingMessages[messageIndex]);
    }, 1200);

    const progressTimer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(progressTimer);
          clearInterval(messageTimer);

          if (showReleaseNotes) {
            setMessage("Temos novidades para você!");
            setTimeout(() => setStep("showing_release"), 1500);
          } else if (showCategoryMigration) {
            setStep("showing_migration");
          } else {
            setStep("redirecting");
          }
          return 100;
        }
        return prevProgress + 1;
      });
    }, 50);

    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
    };
  }, [
    step,
    isLoading,
    showReleaseNotes,
    showCategoryMigration,
    isAnimationEnabled,
  ]);

  // useEffect para o redirecionamento
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
    } catch (error) {
      console.error("Erro ao salvar a visualização das notas:", error);
    } finally {
      if (showCategoryMigration) {
        setStep("showing_migration");
      } else {
        setStep("redirecting");
      }
    }
  };

  const handleMigrationClose = () => {
    setStep("redirecting");
  };

  // --- RENDERIZAÇÃO BASEADA NO 'step' ---

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

  // Para os estados 'animating' e 'redirecting', mostramos o loader.
  if (isAnimationEnabled && (step === "animating" || step === "redirecting")) {
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
            <p className="text-lg text-muted-foreground mb-4 h-6 transition-opacity duration-300">
              {message}
            </p>
            <Progress value={progress} className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Para todos os outros casos (animação desligada, passo 'redirecting', etc.), mostra o loader estático
  return <AppLoader text="Quase lá..." />;
}
