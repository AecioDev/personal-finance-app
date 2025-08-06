// src/components/categories/category-form-content.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Category } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { categoriesCRUD } from "@/hooks/use-categories-crud";
import { useAuth } from "@/components/providers/auth-provider";
import { suggestedIcons } from "./icon-list";

interface CategoryFormContentProps {
  editingCategory: Category | null;
  onClose: () => void;
}

export function CategoryFormContent({
  editingCategory,
  onClose,
}: CategoryFormContentProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("mdi:shape-outline");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setSelectedIcon(editingCategory.icon);
    } else {
      // Reset para o estado inicial de criação
      setName("");
      setSelectedIcon("mdi:shape-outline");
    }
  }, [editingCategory]);

  const handleSave = async () => {
    if (!name.trim() || !user) {
      toast({
        title: "Erro",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const categoryData = { name, icon: selectedIcon };
      if (editingCategory) {
        await categoriesCRUD.update(editingCategory.id, categoryData);
      } else {
        await categoriesCRUD.add(categoryData, user.uid);
      }
      onClose();
    } catch (error) {
      // O hook já mostra um toast de erro, então não precisamos de outro aqui.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Categoria</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Contas de Casa"
        />
      </div>
      <div className="space-y-2">
        <Label>Ícone</Label>
        <ScrollArea className="h-48 w-full rounded-md border p-4">
          <div className="grid grid-cols-5 gap-4">
            {suggestedIcons.map(({ icon }) => (
              <Button
                key={icon}
                variant={selectedIcon === icon ? "default" : "outline"}
                size="icon"
                onClick={() => setSelectedIcon(icon)}
                className="text-2xl"
              >
                <Icon icon={icon} />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Categoria"}
        </Button>
      </DialogFooter>
    </div>
  );
}
