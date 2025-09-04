"use client";

import React from "react";
import { BottomNavBar } from "./bottom-nav-bar";
import { useModal } from "../providers/modal-provider";
import { NewExpenseModal } from "../modals/new-expense-modal";
import { NewTransactionModal } from "../modals/new-transaction-modal";
import { CategoryManagerDialog } from "../categories/category-manager-dialog";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const {
    isNewExpenseOpen,
    closeNewExpense,
    isNewTransactionOpen,
    closeNewTransaction,
    isCategoryManagerOpen,
    closeCategoryManager,
  } = useModal();
  return (
    <div className="relative mx-auto flex min-h-screen w-full flex-col bg-background md:max-w-screen-md md:shadow-2xl">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNavBar />
      <NewExpenseModal
        isOpen={isNewExpenseOpen}
        onOpenChange={closeNewExpense}
      />
      <NewTransactionModal
        isOpen={isNewTransactionOpen}
        onOpenChange={closeNewTransaction}
      />
      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onOpenChange={(isOpen) => !isOpen && closeCategoryManager()}
      />
    </div>
  );
}
