"use client";

import { DebtForm } from "./debt-form";

interface DebtEditProps {
  debtId: string;
}

export function DebtEdit({ debtId }: DebtEditProps) {
  // Este componente serve como um "wrapper", passando o debtId
  // para o formulário, que conterá toda a lógica de edição.
  return <DebtForm debtId={debtId} />;
}
