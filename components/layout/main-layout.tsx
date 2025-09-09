// in: components/layout/main-layout.tsx

"use client";

import React from "react";
import { BottomNavBar } from "./bottom-nav-bar";
import { useModal } from "../providers/modal-provider";
import { CategoryManagerDialog } from "../categories/category-manager-dialog";
import { useFinance } from "../providers/finance-provider";
import { NewExpenseModal } from "../modals/new-expense-modal";
import { NewIncomeModal } from "../modals/new-income-modal";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const {
    // 2. Pegando os estados corretos do provider
    isNewExpenseModalOpen,
    closeNewExpenseModal,
    isNewIncomeModalOpen,
    closeNewIncomeModal,
    isCategoryManagerOpen,
    closeCategoryManager,
  } = useModal();

  const { refreshData } = useFinance();

  const handleCloseAndUpdate = (closeFn: () => void) => {
    return (isOpen: boolean) => {
      if (!isOpen) {
        closeFn();
        // Não precisamos mais do refreshData aqui, pois o onSnapshot já faz isso.
      }
    };
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full flex-col bg-background md:max-w-screen-md md:shadow-2xl">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNavBar />

      {/* 3. Renderizando os dois modais separados */}
      <NewExpenseModal
        isOpen={isNewExpenseModalOpen}
        onOpenChange={handleCloseAndUpdate(closeNewExpenseModal)}
      />

      <NewIncomeModal
        isOpen={isNewIncomeModalOpen}
        onOpenChange={handleCloseAndUpdate(closeNewIncomeModal)}
      />

      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onOpenChange={handleCloseAndUpdate(closeCategoryManager)}
      />
    </div>
  );
}
