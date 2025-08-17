import { Timestamp } from "firebase/firestore";

export type TransactionType = "income" | "expense";

export type DebtInstallmentStatus = "pending" | "paid" | "overdue" | "partial";

/**
 * Helper para converter os dados do Firestore, que vêm com Timestamps,
 * para o nosso modelo de domínio, que usa objetos Date.
 */
export const convertFirestoreData = <T extends object>(data: T): T => {
  const convertedData = { ...data };
  for (const key in convertedData) {
    if (convertedData[key] instanceof Timestamp) {
      (convertedData as any)[key] = (convertedData[key] as Timestamp).toDate();
    }
  }
  return convertedData;
};

export interface Account {
  id: string;
  name: string;
  balance: number | null;
  icon?: string;
  uid: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  uid: string;
  defaultAccountId?: string;
}

export interface Category {
  id: string;
  uid: string;
  name: string;
  icon: string;
}

export interface DebtType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  uid: string;
}

export interface Debt {
  id: string;
  uid: string;
  description: string;
  originalAmount: number;
  totalRepaymentAmount: number | null;
  isRecurring: boolean;
  type: string;
  categoryId?: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt?: Date;
  currentOutstandingBalance?: number;
  totalPaidOnThisDebt?: number;
  totalInterestPaidOnThisDebt?: number;
  totalFinePaidOnThisDebt?: number;
  paidInstallments?: number;
  totalInstallments: number | null;
  interestRate: number | null;
  fineRate: number | null;
  expectedInstallmentAmount: number | null;
  lastBalanceUpdate?: Date;
}

export interface DebtInstallment {
  /**
   * Identificador único da parcela, gerado pelo Firestore.
   * Ex: "px8Gk2f..."
   */
  id: string;

  /**
   * ID da dívida "mãe" a qual esta parcela pertence.
   * Usado para criar o vínculo entre a dívida e suas parcelas.
   * Ex: "abc123xyz..."
   */
  debtId: string;

  /**
   * ID do usuário proprietário desta parcela.
   * Essencial para as regras de segurança do Firestore.
   */
  uid: string;

  /**
   * O número da parcela dentro da sequência da dívida.
   * Ex: 1, 2, 3... (para um financiamento) ou pode ser nulo para contas únicas.
   */
  installmentNumber?: number;

  /**
   * A data de vencimento prevista para esta parcela.
   * Ex: 2025-12-25
   */
  expectedDueDate: Date;

  /**
   * O valor esperado/original da parcela.
   * Este valor pode ser atualizado caso haja juros.
   * Ex: 771.43
   */
  expectedAmount: number; // Valor Original

  /**
   * O valor total que já foi pago para esta parcela específica.
   * Ex: Se a parcela é de R$100 e o usuário pagou R$30, este campo será 30.
   */
  paidAmount: number; // Valor Pago

  /**
   * O valor que ainda falta pagar nesta parcela.
   * Calculado como: expectedAmount - paidAmount - discountAmount.
   */
  remainingAmount: number; // Valor em Aberto

  /**
   * O valor ATUAL devido. Começa igual ao `expectedAmount`
   * e é atualizado para incluir juros ou encargos.
   */
  currentDueAmount: number;

  /**
   * O valor total de desconto aplicado a esta parcela.
   * Usado quando o usuário paga menos que o valor devido, mas quita a parcela.
   */
  discountAmount: number; // Valor de Desconto

  /**
   * Do valor total pago (`paidAmount`), esta é a parte
   * que corresponde especificamente a juros, multas ou encargos.
   */
  interestPaidAmount: number;

  /**
   * O status atual da parcela.
   * Pode ser: 'pending' (pendente), 'paid' (paga), 'overdue' (vencida), 'partial' (parcialmente paga).
   */
  status: DebtInstallmentStatus;

  /**
   * A data em que a parcela foi efetivamente quitada.
   * Fica nulo enquanto a parcela não estiver 100% paga.
   */
  paymentDate: Date | null;

  /**
   * Uma lista com os IDs de todas as transações de pagamento associadas a esta parcela.
   * Permite rastrear todos os pagamentos (parciais ou totais).
   */
  transactionIds: string[];

  /**
   * A data em que o registro desta parcela foi criado no sistema.
   */
  createdAt?: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  description: string;
  amount: number; // Valor total que saiu da conta
  date: Date;
  categoryId?: string;
  uid: string;
  createdAt?: Date;
  debtInstallmentId: string | null;
  isLoanIncome?: boolean;
  loanSource: string | null;
  paymentMethodId: string | null;
  interestPaid: number | null; // Parte do 'amount' que foi juros/multa
  discountReceived: number | null; // Valor de desconto que abateu da dívida
}
