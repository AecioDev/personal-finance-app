"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useFinance } from "@/components/providers/finance-provider";
import { useToast } from "@/components/ui/use-toast";
import { Category } from "@/interfaces/finance";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { suggestedIcons } from "./icon-list";

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CategoryManagerDialog({
  isOpen,
  onOpenChange,
}: CategoryManagerDialogProps) {
  const { toast } = useToast();
  // CORREÇÃO PRINCIPAL: Tudo vem do useFinance() agora!
  const { categories, loadingFinanceData, addCategory, deleteCategory } =
    useFinance();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState(
    suggestedIcons[0].icon
  );

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      // Chama a função do provider, que já sabe o que fazer.
      await addCategory({ name: newCategoryName, icon: newCategoryIcon });
      toast({ title: "Sucesso!", description: "Nova categoria criada." });
      setNewCategoryName("");
      setNewCategoryIcon(suggestedIcons[0].icon);
    } catch (error) {
      // O provider já setou o erro, mas podemos mostrar um toast aqui se quisermos.
      toast({
        title: "Erro!",
        description: "Não foi possível criar a categoria.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      // Chama a função do provider. Simples assim.
      await deleteCategory(categoryToDelete.id);
      toast({ title: "Sucesso!", description: "Categoria excluída." });
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>

          {/* O formulário e a lista não mudam, apenas a origem dos dados e funções */}
          <form onSubmit={handleAddNewCategory} className="mt-4 border-b pb-6">
            {/* ... (código do formulário de nova categoria, sem alterações) ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="new-category-name">
                  Nome da Nova Categoria
                </Label>
                <Input
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Lazer"
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !newCategoryName.trim()}
              >
                <Icon icon="mdi:plus" className="mr-2" />
                {isSubmitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              <Label>Ícone</Label>
              <ScrollArea className="h-24 w-full rounded-md border p-2">
                <div className="flex flex-wrap gap-2">
                  {suggestedIcons.map(({ icon }) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={newCategoryIcon === icon ? "default" : "outline"}
                      size="icon"
                      onClick={() => setNewCategoryIcon(icon)}
                    >
                      <Icon icon={icon} className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </form>

          <h3 className="text-lg font-medium mt-4">Categorias Existentes</h3>
          <ScrollArea className="h-64 mt-2">
            <Table>
              <TableBody>
                {loadingFinanceData && (
                  <TableRow>
                    <TableCell className="text-center">Carregando...</TableCell>
                  </TableRow>
                )}
                {!loadingFinanceData &&
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="w-12">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Icon icon={category.icon} className="h-5 w-5" />
                        </div>
                      </TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Icon
                            icon="mdi:delete-outline"
                            className="text-destructive"
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={`Excluir "${categoryToDelete?.name}"?`}
        description="Esta ação removerá a categoria de todas as despesas associadas. Esta ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </>
  );
}
