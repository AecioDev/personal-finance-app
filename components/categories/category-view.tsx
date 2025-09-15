// src/components/categories/category-view.tsx (VERSÃO COM POPOVER)
"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { PageViewLayout } from "../layout/page-view-layout";
import { useFinance } from "../providers/finance-provider";
import { Button } from "../ui/button";
import { Category } from "@/interfaces/finance";
import { useToast } from "../ui/use-toast";
import { ConfirmationDialog } from "../common/confirmation-dialog";
import { CategoryManagerDialog } from "./category-manager-dialog";
import { suggestedCategories } from "@/lib/data/defaults";

// NOVO: Importando componentes do Popover
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "../ui/scroll-area";

export function CategoryView() {
  const { toast } = useToast();
  const { categories, deleteCategory, addCategory } = useFinance();

  const [categorySelected, setCategorySelected] = useState<Category | null>(
    null
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  // NOVO: Estado para controlar o Popover
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const availableSuggestions = useMemo(() => {
    const userCategoryDefaultIds = new Set(
      categories.map((c) => c.defaultId).filter(Boolean)
    );
    return suggestedCategories.filter(
      (suggestion) => !userCategoryDefaultIds.has(suggestion.id)
    );
  }, [categories]);

  // ALTERADO: A função agora fecha o Popover após adicionar
  const handleAddSuggestion = async (suggestion: {
    name: string;
    icon: string;
    id: string;
  }) => {
    try {
      await addCategory({
        name: suggestion.name,
        icon: suggestion.icon,
        defaultId: suggestion.id,
      });
      toast({
        title: "Sucesso!",
        description: `Categoria "${suggestion.name}" adicionada.`,
      });
      // Fecha o popover se todas as sugestões foram adicionadas
      if (availableSuggestions.length <= 1) {
        setIsSuggestionsOpen(false);
      }
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível adicionar a categoria: ${error}`,
        variant: "destructive",
      });
    }
  };

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
        description: `Não foi possível excluir a categoria: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setCategorySelected(null);
    }
  };

  return (
    <PageViewLayout title="Categorias">
      <div className="flex w-full my-2 gap-2">
        <Button
          className="flex-1 text-base font-semibold bg-status-complete text-status-complete-foreground"
          size="sm"
          onClick={handleAddClick}
        >
          <Icon icon="mdi:plus" className="h-6 w-6 mr-2" />
          Nova Categoria
        </Button>

        {/* ✅ ALTERADO: Bloco de sugestões agora usa um Popover */}
        {availableSuggestions.length > 0 && (
          <Popover open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Icon
                  icon="mdi:lightbulb-on-outline"
                  className="h-5 w-5 mr-2"
                />
                Ver Sugestões
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Sugestões</h4>
                  <p className="text-sm text-muted-foreground">
                    Adicione categorias com um clique.
                  </p>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-4">
                    {availableSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon icon={suggestion.icon} className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {suggestion.name}
                          </span>
                        </div>
                        <Icon
                          icon="mdi:plus-circle-outline"
                          className="w-5 h-5 text-muted-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="space-y-4">
        {/* O resto do componente continua igual... */}
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
          onOpenChange={setIsManagerOpen}
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
