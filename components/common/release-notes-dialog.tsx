// components/common/release-notes-dialog.tsx (VERSÃO DINÂMICA)
"use client";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { releaseNotes } from "@/lib/release-notes"; // ✅ 1. IMPORTAR AS NOTAS

interface ReleaseNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export const ReleaseNotesDialog = ({
  isOpen,
  onClose,
  version,
}: ReleaseNotesDialogProps) => {
  const { user, projectId } = useAuth();

  // ✅ 2. BUSCAR A NOTA CORRETA USANDO A VERSÃO
  const currentNote = releaseNotes[version];

  const handleConfirm = async () => {
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
        { lastReleaseNotesSeen: version },
        { merge: true }
      );
      onClose();
    } catch (error) {
      console.error("Erro ao salvar a visualização das notas:", error);
      onClose();
    }
  };

  // Se por algum motivo a versão não for encontrada no nosso arquivo, não mostra nada.
  if (!currentNote) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface text-surface-foreground">
        <DialogHeader>
          {/* ✅ 3. RENDERIZAR O CONTEÚDO DINÂMICO */}
          <DialogTitle className="text-2xl">{currentNote.title}</DialogTitle>
          <DialogDescription>{currentNote.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <p className="font-semibold text-foreground">Últimas modificações:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {currentNote.changes.map((change, index) => (
              <li key={index}>
                <span className="font-semibold text-foreground">
                  {change.title}:
                </span>{" "}
                {change.detail}
              </li>
            ))}
          </ul>
          {currentNote.nextStep && (
            <p className="pt-4 text-accent font-semibold">
              {currentNote.nextStep}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm}>Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
