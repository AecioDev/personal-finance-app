"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { PageViewLayout } from "../layout/page-view-layout";
import { useFinance } from "../providers/finance-provider";
import { Button } from "../ui/button";
import { Category } from "@/interfaces/finance";
import { useToast } from "../ui/use-toast";
import { ConfirmationDialog } from "../common/confirmation-dialog";
import { CategoryManagerDialog } from "./category-manager-dialog";

export function CategoryView() {
  const { toast } = useToast();
  const { categories, deleteCategory } = useFinance();

  const [categorySelected, setCategorySelected] = useState<Category | null>(
    null
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const handleEditClick = (category: Category) => {
    setCategorySelected(category);
    setIsManagerOpen(true);
  };

  const handleAddClick = () => {
    setCategorySelected(null);
    setIsManagerOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategorySelected(category);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categorySelected) return;
    try {
      await deleteCategory(categorySelected.id);
      toast({ title: "Sucesso!", description: "Categoria excluída." });
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setCategorySelected(null);
    }
  };

  return (
    <PageViewLayout title="Categorias">
      <div>
        <Button
          className="w-full my-2 text-base font-semibold bg-status-complete text-status-complete-foreground"
          size="sm"
          onClick={handleAddClick}
        >
          <Icon icon="mdi:plus" className="h-6 w-6" />
          Nova Categoria
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-background hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-b-2 border-status-complete"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                <Icon
                  icon={item.icon}
                  className="w-10 h-10 text-status-complete"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="font-bold text-lg text-foreground truncate">
                  {item.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleEditClick(item)}
              >
                <Icon icon="fa6-solid:pencil" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeleteClick(item)}
              >
                <Icon icon="fa6-solid:trash-can" />
              </Button>
            </div>
          </div>
        ))}

        <CategoryManagerDialog
          isOpen={isManagerOpen}
          onOpenChange={setIsManagerOpen} // Ajuste fino aqui
          categoryToEdit={categorySelected}
        />

        <ConfirmationDialog
          isOpen={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          title={`Excluir "${categorySelected?.name}"?`}
          description="Esta ação não pode ser desfeita."
          onConfirm={handleConfirmDelete}
          variant="destructive"
        />
      </div>
    </PageViewLayout>
  );
}
