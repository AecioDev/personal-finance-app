// src/components/extrato/extrato-filters.tsx
"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useFinance } from "../providers/finance-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { EntryType } from "@/interfaces/financial-entry";
import {
  startOfMonth,
  endOfMonth,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { DatePicker } from "../ui/date-picker";

export interface Filters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  type: "all" | EntryType;
  status: "all" | "paid" | "pending";
  accountId: string;
  categoryId: string;
}

interface ExtratoFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

export function ExtratoFilters({ onFilterChange }: ExtratoFiltersProps) {
  const { accounts, categories } = useFinance();
  const [isOpen, setIsOpen] = useState(false);

  const defaultFilters: Filters = {
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    type: "all",
    status: "paid",
    accountId: "all",
    categoryId: "all",
  };

  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // aplica em tempo real (exceto datas)
  const updateFilter = (patch: Partial<Filters>) => {
    const newFilters = { ...filters, ...patch };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // atalhos rápidos
  const applyQuickFilter = (range: "month" | "7days" | "30days") => {
    let dateFrom: Date;
    let dateTo: Date = endOfDay(new Date());

    if (range === "month") {
      dateFrom = startOfMonth(new Date());
      dateTo = endOfMonth(new Date());
    } else if (range === "7days") {
      dateFrom = startOfDay(subDays(new Date(), 7));
    } else {
      dateFrom = startOfDay(subDays(new Date(), 30));
    }

    const newFilters = { ...filters, dateFrom, dateTo };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const applyDateRange = () => onFilterChange(filters);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-[2rem] shadow-md bg-primary text-primary-foreground p-4"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <div
            role="button"
            className="flex w-full items-center justify-between cursor-pointer"
          >
            <h4 className="text-sm font-semibold">Filtros</h4>
            <Icon
              icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
              className="h-5 w-5 transition-transform duration-200"
            />
          </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-6 pt-6">
        {/* Atalhos rápidos */}
        <div className="flex items-center justify-start gap-2">
          <div className="space-y-2">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/80"
              onClick={() => applyQuickFilter("month")}
            >
              Este mês
            </Button>
          </div>
          <div className="space-y-2">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/80"
              onClick={() => applyQuickFilter("7days")}
            >
              Últimos 7 dias
            </Button>
          </div>
          <div className="space-y-2">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/80"
              onClick={() => applyQuickFilter("30days")}
            >
              Últimos 30 dias
            </Button>
          </div>
        </div>

        {/* Datas com botão aplicar */}
        <div className="flex items-end justify-start gap-2 p-2 bg-background/80 dark:bg-background/20 rounded-lg">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-primary-foreground/80 ml-1">
              De:
            </label>
            <DatePicker
              value={filters.dateFrom}
              onChange={(date) => setFilters((f) => ({ ...f, dateFrom: date }))}
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-primary-foreground/80 ml-1">
              Até:
            </label>
            <DatePicker
              value={filters.dateTo}
              onChange={(date) => setFilters((f) => ({ ...f, dateTo: date }))}
            />
          </div>
          <div className="flex-shrink-0">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/80"
              onClick={applyDateRange}
            >
              <Icon icon="fa6-solid:check" className="h-4 w-4" />
              <span className="hidden md:inline ml-2">Aplicar</span>
            </Button>
          </div>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Lançamento</label>
          <ToggleGroup
            type="single"
            value={filters.type}
            onValueChange={(value: string) =>
              value && updateFilter({ type: value as Filters["type"] })
            }
            className="w-full grid grid-cols-4 bg-background/80 dark:bg-background/20 p-1 rounded-sm"
          >
            <ToggleGroupItem value="all">Todos</ToggleGroupItem>
            <ToggleGroupItem value="expense">Despesas</ToggleGroupItem>
            <ToggleGroupItem value="income">Receitas</ToggleGroupItem>
            <ToggleGroupItem value="transfer">Transf.</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <ToggleGroup
            type="single"
            value={filters.status}
            onValueChange={(value: string) =>
              value && updateFilter({ status: value as Filters["status"] })
            }
            className="w-full grid grid-cols-3 bg-background/80 dark:bg-background/20 p-1 rounded-sm"
          >
            <ToggleGroupItem value="all">Todos</ToggleGroupItem>
            <ToggleGroupItem value="paid">Realizados</ToggleGroupItem>
            <ToggleGroupItem value="pending">Pendentes</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Conta */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Conta</label>
          <Select
            value={filters.accountId}
            onValueChange={(value) => updateFilter({ accountId: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria</label>
          <Select
            value={filters.categoryId}
            onValueChange={(value) => updateFilter({ categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
