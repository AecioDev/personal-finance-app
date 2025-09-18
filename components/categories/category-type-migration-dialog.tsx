// components/categories/category-type-migration-dialog.tsx (VERSÃO COM BORDA DO CHECKBOX AJUSTADA)
"use client";

import { useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/interfaces/finance";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "../ui/scroll-area";

interface CategoryTypeMigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export const CategoryTypeMigrationDialog = ({
  isOpen,
  onClose,
  categories,
}: CategoryTypeMigrationDialogProps) => {
  const { migrateCategoryTypes } = useFinance();
  const { toast } = useToast();
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<Set<string>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (categoryId: string) => {
    const newSet = new Set(selectedIncomeIds);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setSelectedIncomeIds(newSet);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      const allUntaggedIds = categories.map((c) => c.id);
      await migrateCategoryTypes(Array.from(selectedIncomeIds), allUntaggedIds);
      toast({
        title: "Sucesso!",
        description: "Suas categorias foram organizadas.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível salvar as alterações: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-surface text-surface-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Organize suas Categorias
          </DialogTitle>
          <DialogDescription>
            Notamos que algumas de suas categorias não têm um tipo definido. Por
            favor, marque abaixo todas as que são de **RECEITA**. As não
            marcadas serão definidas como despesa.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="my-4 max-h-64 pr-4">
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleToggle(cat.id)}
                className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted cursor-pointer transition-colors"
              >
                <Checkbox
                  id={cat.id}
                  checked={selectedIncomeIds.has(cat.id)}
                  onCheckedChange={() => handleToggle(cat.id)}
                  // ✅ CLASSE ATUALIZADA PARA USAR A COR DE BORDA DO TEMA
                  className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground"
                />
                <label
                  htmlFor={cat.id}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {cat.name}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Organização"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
