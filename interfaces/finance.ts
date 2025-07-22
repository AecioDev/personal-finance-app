// src/interfaces/finance.ts

// Interface para Contas (Bancárias, Carteiras, etc.)
export interface Account {
  id: string;
  name: string;
  balance: number;
  icon?: string; // Ex: 'bank', 'credit-card', 'wallet'
  uid: string;
}

// Interface para Dívidas Principais ou Compromissos Recorrentes
export interface Debt {
  id: string; // ID único da dívida/compromisso
  uid: string; // ID do usuário
  type: string; // Tipo da dívida
  description: string; // Ex: "Fatura Cartão Nubank Maio", "Conta de Internet"

  originalAmount: number | null; // Valor total da dívida (se parcelada) OU valor mensal esperado (se recorrente)

  isRecurring: boolean; // Indica se é um compromisso recorrente (true) ou uma dívida parcelada (false)

  // Campos para Dívidas Parceladas (só se isRecurring for false)
  currentOutstandingBalance?: number; // Saldo devedor atual
  totalPaidOnThisDebt?: number; // Soma de tudo que foi pago (principal + juros + multas)
  totalInterestPaidOnThisDebt?: number; // Soma total de juros pagos
  totalFinePaidOnThisDebt?: number; // Soma total de multas pagas
  totalInstallments: number | null; // Número total de parcelas
  paidInstallments?: number; // Número de parcelas já pagas
  interestRate?: number | null; // Taxa de juros anual/mensal
  fineRate?: number | null; // Taxa de multa por atraso
  expectedInstallmentAmount?: number | null; // Valor esperado de cada parcela (se não for recorrente e tiver parcelas)

  startDate: string; // Data de início da dívida/compromisso (YYYY-MM-DD)
  endDate: string | null; // Data de término esperada (para dívidas parceladas)
  isActive: boolean; // Se a dívida/compromisso está ativo
  createdAt?: any; // Timestamp de criação no Firestore
}

// Interface para Ocorrências/Parcelas de Dívidas ou Contas Recorrentes
export interface DebtInstallment {
  id: string; // ID único da ocorrência/parcela
  debtId: string; // ID da dívida/compromisso principal
  uid: string; // ID do usuário

  installmentNumber?: number; // Número da parcela (ex: 1 de 3) - Opcional para recorrentes

  expectedDueDate: string; // Data de vencimento esperada (YYYY-MM-DD)
  expectedAmount: number | null; // Valor original esperado (da parcela ou da conta recorrente)

  status: "pending" | "paid" | "overdue"; // Status da ocorrência/parcela

  actualPaidAmount: number | null; // O que foi *realmente* pago
  interestPaidOnInstallment: number | null; // Juros pagos *nesta* ocorrência
  finePaidOnInstallment: number | null; // Multa paga *nesta* ocorrência
  paymentDate: string | null; // Data em que foi realmente paga (YYYY-MM-DD)

  transactionId: string | null; // ID do lançamento que registrou este pagamento
  createdAt?: any; // Timestamp de criação no Firestore
}

// Tipo para o tipo de transação (receita ou despesa)
export type TransactionType = "income" | "expense";

// Interface para Lançamentos (Transações)
export interface Transaction {
  id: string; // ID único da transação
  accountId: string; // ID da conta de origem/destino
  type: TransactionType; // Tipo: receita ou despesa
  description: string; // Descrição do lançamento
  amount: number; // Valor *real* da transação (o que de fato entrou/saiu da conta)
  date: string; // Data da transação (YYYY-MM-DD)
  category: string; // Categoria (ex: 'salário', 'internet', 'pagamento_divida')
  uid: string;
  createdAt?: any; // Timestamp de criação no Firestore

  // Campo para vincular a uma ocorrência de dívida/recorrente
  debtInstallmentId: string | null; // ID da ocorrência/parcela da dívida que este lançamento pagou

  // Campo para Receitas de Empréstimos
  isLoanIncome: boolean; // Indica se esta receita é a entrada de um empréstimo
  loanSource: string | null; // Origem do empréstimo

  // Campo para vincular a forma de pagamento
  paymentMethodId: string | null; // ID da forma de pagamento utilizada (PIX, Cartão, Dinheiro, etc.)
}

// Interface para Formas de Pagamento
export interface PaymentMethod {
  id: string; // ID único da forma de pagamento
  uid: string; // ID do usuário
  name: string; // Nome da forma de pagamento (ex: "PIX", "Cartão de Crédito Nubank", "Dinheiro")
  description?: string; // Descrição opcional
  isActive: boolean; // Se a forma de pagamento está ativa
  createdAt?: any; // Timestamp de criação no Firestore
  defaultAccountId?: string | null; // ID da conta padrão vinculada a esta forma de pagamento
}

// Tipo de Dívida
export interface DebtType {
  id: string;
  uid: string; // ID do usuário
  name: string; // Ex: "Contas de Casa", "Streaming", "Educação"
  description?: string; // Descrição opcional
  isActive: boolean; // Se o tipo está ativo
  createdAt?: any; // Timestamp de criação no Firestore
}
