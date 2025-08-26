"use client";

import React from "react";
import { BottomNavBar } from "./bottom-nav-bar";
import { useModal } from "../providers/modal-provider";
import { NewExpenseModal } from "../modals/new-expense-modal";
import { NewTransactionModal } from "../modals/new-transaction-modal";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const {
    isNewExpenseOpen,
    closeNewExpense,
    isNewTransactionOpen,
    closeNewTransaction,
  } = useModal();
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">{children}</main>
      <BottomNavBar />
      <NewExpenseModal
        isOpen={isNewExpenseOpen}
        onOpenChange={closeNewExpense}
      />
      <NewTransactionModal
        isOpen={isNewTransactionOpen}
        onOpenChange={closeNewTransaction}
      />
    </div>
  );
}
