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
}

export interface DebtInstallment {
  id: string;
  debtId: string;
  uid: string;
  installmentNumber?: number;
  expectedDueDate: Date;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  discountAmount: number;
  status: DebtInstallmentStatus;
  paymentDate: Date | null;
  transactionIds: string[];
  createdAt?: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  description: string;
  amount: number; // Valor total que saiu da conta
  date: Date;
  category: string;
  uid: string;
  createdAt?: Date;
  debtInstallmentId: string | null;
  isLoanIncome?: boolean;
  loanSource: string | null;
  paymentMethodId: string | null;
  interestPaid: number | null; // Parte do 'amount' que foi juros/multa
  discountReceived: number | null; // Valor de desconto que abateu da dívida
}
