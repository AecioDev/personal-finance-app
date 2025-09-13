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

/**
 * Pega um objeto ou array de dados e dispara o download de um arquivo JSON.
 * @param data O objeto ou array de dados a ser salvo.
 * @param filename O nome do arquivo JSON que será baixado.
 */
export const downloadAsJson = (data: unknown, filename: string) => {
  // Converte o dado para uma string JSON formatada (com 2 espaços de indentação)
  const jsonStr = JSON.stringify(data, null, 2);

  // Cria um "Blob", que é um objeto semelhante a um arquivo, a partir da string
  const blob = new Blob([jsonStr], { type: "application/json" });

  // Cria uma URL temporária para o Blob
  const url = URL.createObjectURL(blob);

  // Cria um elemento de link <a> invisível
  const link = document.createElement("a");
  link.href = url;
  link.download = filename; // Define o nome do arquivo para o download

  // Adiciona o link ao corpo da página, clica nele programaticamente e o remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Libera a URL da memória para evitar vazamentos
  URL.revokeObjectURL(url);

  console.log(`Arquivo ${filename} gerado para download.`);
};
