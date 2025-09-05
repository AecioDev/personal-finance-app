"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { Category } from "@/interfaces/finance";

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
import { defaultCategories } from "@/lib/data/defaults";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils"; // Importando o helper 'cn'

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
  const [categoryIcon, setCategoryIcon] = useState(defaultCategories[0].icon);

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setCategoryName(categoryToEdit.name);
        setCategoryIcon(categoryToEdit.icon);
      } else {
        setCategoryName("");
        setCategoryIcon(defaultCategories[0].icon);
      }
    }
  }, [isOpen, categoryToEdit]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast({
        title: "Atenção!",
        description: "O nome da categoria не pode estar em branco.",
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
        await addCategory({ name: categoryName, icon: categoryIcon });
        toast({ title: "Sucesso!", description: "Nova categoria criada." });
      }
      handleClose();
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível salvar a categoria.`,
        variant: "destructive",
      });
    }
  };

  const isFormDisabled = !categoryName.trim();
  const dialogTitle = categoryToEdit ? "Editar Categoria" : "Nova Categoria";
  const dialogDescription = "Preencha os detalhes da sua categoria abaixo.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <Label
              htmlFor="category-name"
              className="mb-2 block text-sm font-medium"
            >
              Descrição
            </Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Moradia, Lazer..."
              className="text-base h-12"
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Ícone</Label>
            <ScrollArea className="h-40 w-full rounded-md border p-2">
              <div className="grid grid-cols-5 gap-2">
                {defaultCategories.map(({ icon, name }) => (
                  <div
                    key={name}
                    title={name}
                    className={cn(
                      "flex justify-center items-center aspect-square cursor-pointer rounded-md border-2 transition-colors",
                      // Lógica da borda: primária se selecionado, padrão se não.
                      categoryIcon === icon
                        ? "border-primary"
                        : "border-border hover:border-primary/40"
                    )}
                    onClick={() => setCategoryIcon(icon)}
                  >
                    <Icon
                      icon={icon}
                      className={cn(
                        "h-10 w-10 transition-colors",
                        categoryIcon === icon
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              className="bg-status-complete text-status-complete-foreground"
              type="submit"
              disabled={isFormDisabled}
            >
              <Icon
                icon={categoryToEdit ? "fa6-solid:check" : "fa6-solid:plus"}
                className="mr-2 h-5 w-5"
              />
              {categoryToEdit ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
