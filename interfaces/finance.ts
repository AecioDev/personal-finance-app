// in: interfaces/finance.ts

export type TransactionType = "income" | "expense";

export type DebtInstallmentStatus = "pending" | "paid" | "overdue" | "partial";

export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  uid: string;
  name: string;
  icon: string;
  type: CategoryType;
  defaultId?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number | null;
  icon?: string;
  uid: string;
  defaultId?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  uid: string;
  defaultAccountId?: string;
  defaultId?: string;
}
