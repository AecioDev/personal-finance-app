// in: components/providers/modal-provider.tsx

"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type CustomAction = {
  label: string;
  icon: string;
  action: () => void;
};

// A interface agora reflete as duas novas ações
interface ModalContextType {
  isNewExpenseModalOpen: boolean;
  openNewExpenseModal: () => void;
  closeNewExpenseModal: () => void;

  isNewIncomeModalOpen: boolean;
  openNewIncomeModal: () => void;
  closeNewIncomeModal: () => void;

  isCategoryManagerOpen: boolean;
  openCategoryManager: () => void;
  closeCategoryManager: () => void;

  customActions: CustomAction[];
  setCustomActions: (actions: CustomAction[]) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isNewIncomeModalOpen, setIsNewIncomeModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [customActions, setCustomActions] = useState<CustomAction[]>([]);

  const value = {
    isNewExpenseModalOpen,
    openNewExpenseModal: () => setIsNewExpenseModalOpen(true),
    closeNewExpenseModal: () => setIsNewExpenseModalOpen(false),

    isNewIncomeModalOpen,
    openNewIncomeModal: () => setIsNewIncomeModalOpen(true),
    closeNewIncomeModal: () => setIsNewIncomeModalOpen(false),

    isCategoryManagerOpen,
    openCategoryManager: () => setIsCategoryManagerOpen(true),
    closeCategoryManager: () => setIsCategoryManagerOpen(false),
    customActions,
    setCustomActions,
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
