// src/components/categories/category-view.tsx (VERSÃO COMPLETA E ATUALIZADA)
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "../ui/scroll-area";

// ✅ 1. COMPONENTE AUXILIAR REUTILIZÁVEL
// Criei este componente para renderizar uma lista de categorias.
// Assim, não precisamos repetir o código para a lista de despesas e de receitas.
const CategoryList = ({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) => (
  <div>
    <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b-2 border-primary/20">
      {title}
    </h2>
    {categories.length > 0 ? (
      <div className="space-y-3">
        {categories.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-background hover:bg-muted/50 transition-colors border-b-2 border-border/50"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-muted">
                <Icon icon={item.icon} className="w-7 h-7 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="font-bold text-base text-foreground truncate">
                  {item.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onEdit(item)}
              >
                <Icon icon="fa6-solid:pencil" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onDelete(item)}
              >
                <Icon icon="fa6-solid:trash-can" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhuma categoria deste tipo cadastrada.
      </p>
    )}
  </div>
);

export function CategoryView() {
  const { toast } = useToast();
  const { categories, deleteCategory, addCategory } = useFinance();

  const [categorySelected, setCategorySelected] = useState<Category | null>(
    null
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const { incomeCategories, expenseCategories } = useMemo(() => {
    const income: Category[] = [];
    const expense: Category[] = [];
    categories.forEach((cat) => {
      if (cat.type === "income") {
        income.push(cat);
      } else {
        expense.push(cat);
      }
    });
    return {
      incomeCategories: income.sort((a, b) => a.name.localeCompare(b.name)),
      expenseCategories: expense.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [categories]);

  const availableSuggestions = useMemo(() => {
    const userCategoryDefaultIds = new Set(
      categories.map((c) => c.defaultId).filter(Boolean)
    );
    return suggestedCategories.filter(
      (suggestion) => !userCategoryDefaultIds.has(suggestion.id)
    );
  }, [categories]);

  const handleAddSuggestion = async (suggestion: {
    name: string;
    icon: string;
    id: string;
    type: "income" | "expense";
  }) => {
    try {
      await addCategory({
        name: suggestion.name,
        icon: suggestion.icon,
        defaultId: suggestion.id,
        type: suggestion.type,
      });
      toast({
        title: "Sucesso!",
        description: `Categoria "${suggestion.name}" adicionada.`,
      });
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
    <PageViewLayout
      title="Categorias"
      subtitle="Gerencie suas categorias de receitas e despesas."
    >
      <div className="flex w-full my-2 gap-2">
        <Button
          className="flex-1 text-base font-semibold bg-primary text-primary-foreground"
          size="sm"
          onClick={handleAddClick}
        >
          <Icon icon="mdi:plus" className="h-6 w-6 mr-2" />
          Nova Categoria
        </Button>

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

      {/* ✅ 3. RENDERIZANDO AS DUAS LISTAS SEPARADAMENTE */}
      {/* Usamos o nosso componente auxiliar para mostrar as listas, uma depois da outra. */}
      <div className="space-y-8 mt-6">
        <CategoryList
          title="Categorias de Despesa"
          categories={expenseCategories}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
        <CategoryList
          title="Categorias de Receita"
          categories={incomeCategories}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>

      <CategoryManagerDialog
        isOpen={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        categoryToEdit={categorySelected}
      />
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={`Excluir "${categorySelected?.name}"?`}
        description="Esta ação não pode ser desfeita e irá desvincular esta categoria de todos os lançamentos associados."
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </PageViewLayout>
  );
}
