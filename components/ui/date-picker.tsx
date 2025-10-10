"use client";

import React, { useState } from "react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    value ? format(value, "dd/MM/yyyy") : ""
  );
  const [month, setMonth] = useState<Date>(value || new Date());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Tenta converter a data digitada
    const parsedDate = parse(newValue, "dd/MM/yyyy", new Date());
    if (!isNaN(parsedDate.getTime())) {
      onChange(parsedDate);
      setMonth(parsedDate);
    }
  };

  const handleSelect = (date?: Date) => {
    if (!date) return;
    onChange(date);
    setInputValue(format(date, "dd/MM/yyyy"));
    setMonth(date);
    setIsOpen(false);
  };

  const handleMonthChange = (monthsToAdd: number) => {
    const newMonth = new Date(month);
    newMonth.setMonth(month.getMonth() + monthsToAdd);
    setMonth(newMonth);
  };

  const handleYearChange = (yearsToAdd: number) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(month.getFullYear() + yearsToAdd);
    setMonth(newMonth);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="relative w-full"
          onClick={() => setIsOpen(true)} // mantém aberto ao clicar em qualquer parte
        >
          <Icon
            icon="mdi:calendar"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="dd/mm/aaaa"
            disabled={disabled}
            className={cn(
              "w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[280px] p-0"
        align="start"
        onInteractOutside={() => setIsOpen(false)}
      >
        {/* Cabeçalho personalizado */}
        <div className="flex items-center justify-center px-3 py-2 text-sm border-b gap-2">
          <select
            value={month.getMonth()}
            onChange={(e) => {
              const newMonth = new Date(month);
              newMonth.setMonth(Number(e.target.value));
              setMonth(newMonth);
            }}
            className="bg-transparent text-sm border rounded-md px-2 py-1 hover:bg-muted focus:outline-none"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {format(new Date(2025, i, 1), "MMMM", { locale: ptBR })}
              </option>
            ))}
          </select>

          <select
            value={month.getFullYear()}
            onChange={(e) => {
              const newMonth = new Date(month);
              newMonth.setFullYear(Number(e.target.value));
              setMonth(newMonth);
            }}
            className="bg-transparent text-sm border rounded-md px-2 py-1 hover:bg-muted focus:outline-none"
          >
            {Array.from({ length: 11 }).map((_, i) => {
              const currentYear = new Date().getFullYear();
              const year = currentYear - 5 + i; // 5 anos pra trás e 5 pra frente
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>

        {/* Calendário */}
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          locale={ptBR}
          showOutsideDays={false}
          className="[&_table]:w-full [&_table]:mx-auto [&_table]:text-center"
        />
      </PopoverContent>
    </Popover>
  );
}
