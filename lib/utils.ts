import { DebtInstallment, DebtInstallmentStatus } from "@/interfaces/finance";
import { clsx, type ClassValue } from "clsx";
import { isPast, isToday } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCalculatedInstallmentStatus = (
  installment: DebtInstallment
): DebtInstallmentStatus => {
  // Usamos uma pequena tolerância para evitar problemas com ponto flutuante.
  const tolerance = 0.001;

  if (installment.remainingAmount <= tolerance) {
    return "paid";
  }
  if (installment.paidAmount > 0 && installment.remainingAmount > tolerance) {
    return "partial";
  }
  // Se a data de vencimento já passou (e não é hoje), está atrasada.
  if (
    isPast(installment.expectedDueDate) &&
    !isToday(installment.expectedDueDate)
  ) {
    return "overdue";
  }
  return "pending";
};
