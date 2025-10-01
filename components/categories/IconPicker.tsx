// src/components/categories/IconPicker.tsx (VERSÃO FINAL COM A SUA SOLUÇÃO)
"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { availableIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = availableIcons.filter((icon) =>
    icon.split(":")[1].toLowerCase().includes(search.toLowerCase())
  );

  const handleIconSelect = (icon: string) => {
    onChange(icon);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center gap-2 cursor-pointer">
          <div className="w-24 h-24 rounded-md bg-background border-2 border-ring flex items-center justify-center">
            <Icon icon={value} className="w-12 h-12 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Trocar ícone</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolha um Ícone</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Buscar ícone (ex: 'carro', 'casa'...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="my-4"
        />
        <ScrollArea className="h-72 w-full">
          <div className="grid grid-cols-4 gap-2">
            {filteredIcons.map((icon) => (
              <div
                key={icon}
                onClick={() => handleIconSelect(icon)}
                className={cn(
                  "flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 transition-colors",
                  value === icon
                    ? "border-transparent hover:border-border"
                    : "border-primary bg-muted"
                )}
              >
                <Icon
                  icon={icon}
                  className={cn(
                    "h-10 w-10",
                    value === icon
                      ? "text-muted-foreground"
                      : "text-foreground/60"
                  )}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
