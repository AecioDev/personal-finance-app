"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Define o que o nosso contexto vai fornecer
interface ModalContextType {
  isNewExpenseOpen: boolean;
  openNewExpense: () => void;
  closeNewExpense: () => void;
  isNewTransactionOpen: boolean;
  openNewTransaction: () => void;
  closeNewTransaction: () => void;
}

// Cria o contexto com um valor padrão
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Cria o componente Provedor
export function ModalProvider({ children }: { children: ReactNode }) {
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);

  const value = {
    isNewExpenseOpen,
    openNewExpense: () => setIsNewExpenseOpen(true),
    closeNewExpense: () => setIsNewExpenseOpen(false),
    isNewTransactionOpen,
    openNewTransaction: () => setIsNewTransactionOpen(true),
    closeNewTransaction: () => setIsNewTransactionOpen(false),
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

// Cria um hook customizado para facilitar o uso do contexto
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
