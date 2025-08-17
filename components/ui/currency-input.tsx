"use client";

import React from "react";
import { Input } from "@/components/ui/input";

// A interface de props agora usa o tipo nativo do React para um elemento input,
// que é a forma mais correta e segura de fazer.
export interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value: number;
  onChange: (value: number) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(({ value, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      onChange(0);
      return;
    }
    const numericValue = Number(digits) / 100;
    onChange(numericValue);
  };

  const displayValue = formatCurrency(value || 0);

  return (
    <Input
      {...props}
      ref={ref}
      value={displayValue}
      onChange={handleChange}
      onFocus={(e) => e.target.select()}
      // Forçamos o tipo para "text" para que a máscara de moeda funcione corretamente.
      // O navegador ainda pode mostrar os controles de número, mas a digitação será livre.
      type="text"
      inputMode="decimal" // Melhora a experiência em teclados mobile
    />
  );
});

CurrencyInput.displayName = "CurrencyInput";
