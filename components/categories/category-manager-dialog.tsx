// src/components/categories/category-manager-dialog.tsx (VERSÃO COM HOVER REFINADO)
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { Category, CategoryType } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { availableIcons } from "@/lib/icons";
import { IconPicker } from "./IconPicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categoryToEdit?: Category | null;
}

export function CategoryManagerDialog({
  isOpen,
  onOpenChange,
  categoryToEdit,
}: CategoryManagerDialogProps) {
  const { toast } = useToast();
  const { addCategory, updateCategory } = useFinance();

  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState(availableIcons[0]);
  const [categoryType, setCategoryType] = useState<CategoryType>("expense");

  const isEditing = !!categoryToEdit;

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setCategoryName(categoryToEdit.name);
        setCategoryIcon(categoryToEdit.icon);
        setCategoryType(categoryToEdit.type);
      } else {
        setCategoryName("");
        setCategoryIcon(availableIcons[0]);
        setCategoryType("expense");
      }
    }
  }, [isOpen, categoryToEdit]);

  const handleClose = () => onOpenChange(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast({
        title: "Atenção!",
        description: "O nome da categoria não pode estar em branco.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, {
          name: categoryName,
          icon: categoryIcon,
        });
        toast({ title: "Sucesso!", description: "Categoria atualizada." });
      } else {
        await addCategory({
          name: categoryName,
          icon: categoryIcon,
          type: categoryType,
        });
        toast({ title: "Sucesso!", description: "Nova categoria criada." });
      }
      handleClose();
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível salvar a categoria: ${error}`,
        variant: "destructive",
      });
    }
  };

  const isFormDisabled = !categoryName.trim();
  const dialogTitle = categoryToEdit ? "Editar Categoria" : "Nova Categoria";
  const dialogDescription = "Preencha os detalhes da sua categoria abaixo.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface text-surface-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label>Tipo da Categoria</Label>
            {isEditing ? (
              <div
                className={cn(
                  "flex items-center justify-center gap-3 rounded-md border-2 p-4",
                  categoryType === "income"
                    ? "border-accent text-accent"
                    : "border-destructive text-destructive"
                )}
              >
                <Icon
                  icon={
                    categoryType === "income"
                      ? "fa6-solid:arrow-trend-up"
                      : "fa6-solid:arrow-trend-down"
                  }
                  className="h-5 w-5"
                />
                <span className="font-semibold">
                  {categoryType === "income" ? "Receita" : "Despesa"}
                </span>
                <span className="text-xs text-muted-foreground">
                  (não pode ser alterado)
                </span>
              </div>
            ) : (
              <RadioGroup
                value={categoryType}
                onValueChange={(value) =>
                  setCategoryType(value as CategoryType)
                }
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="expense"
                    id="type-expense"
                    className="sr-only peer"
                  />
                  <Label
                    htmlFor="type-expense"
                    // ✅ HOVER AJUSTADO
                    className="flex items-center justify-center gap-3 rounded-md border-2 border-muted bg-popover p-4 cursor-pointer transition-colors duration-150 hover:border-destructive hover:text-destructive peer-data-[state=checked]:border-destructive peer-data-[state=checked]:text-destructive"
                  >
                    <Icon
                      icon="fa6-solid:arrow-trend-down"
                      className="h-5 w-5"
                    />
                    <span className="font-semibold">Despesa</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="income"
                    id="type-income"
                    className="sr-only peer"
                  />
                  <Label
                    htmlFor="type-income"
                    // ✅ HOVER AJUSTADO
                    className="flex items-center justify-center gap-3 rounded-md border-2 border-muted bg-popover p-4 cursor-pointer transition-colors duration-150 hover:border-accent hover:text-accent peer-data-[state=checked]:border-accent peer-data-[state=checked]:text-accent"
                  >
                    <Icon icon="fa6-solid:arrow-trend-up" className="h-5 w-5" />
                    <span className="font-semibold">Receita</span>
                  </Label>
                </div>
              </RadioGroup>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <Label className="block text-sm font-medium">Ícone</Label>
              <IconPicker value={categoryIcon} onChange={setCategoryIcon} />
            </div>
            <div className="flex-1">
              <Label
                htmlFor="category-name"
                className="mb-2 block text-sm font-medium"
              >
                Nome da Categoria
              </Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ex: Moradia, Lazer..."
                className="text-base h-12"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              type="submit"
              disabled={isFormDisabled}
            >
              <Icon
                icon={isEditing ? "fa6-solid:check" : "fa6-solid:plus"}
                className="mr-2 h-5 w-5"
              />
              {isEditing ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
