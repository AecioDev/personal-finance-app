/**
 * Este arquivo centraliza os dados padrão para novos usuários
 * ou para a sincronização de contas existentes.
 */
// src/lib/data/defaults.ts
import { CategoryType } from "@/interfaces/finance"; // Importar o tipo

interface DefaultCategory {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
}

// Apenas as categorias mais comuns que todo usuário começa usando
/* prettier-ignore-start */
export const essentialCategories: DefaultCategory[] = [
  {
    id: "default-moradia",
    name: "Moradia",
    icon: "fa6-solid:house-chimney",
    type: "expense",
  },
  {
    id: "default-alimentacao",
    name: "Alimentação",
    icon: "fa6-solid:utensils",
    type: "expense",
  },
  {
    id: "default-contas",
    name: "Contas e Serviços",
    icon: "fa6-solid:file-invoice-dollar",
    type: "expense",
  },
  {
    id: "default-transporte",
    name: "Transporte",
    icon: "fa6-solid:bus",
    type: "expense",
  },
  {
    id: "default-compras",
    name: "Compras",
    icon: "fa6-solid:bag-shopping",
    type: "expense",
  },
  {
    id: "default-lazer",
    name: "Lazer",
    icon: "fa6-solid:martini-glass-citrus",
    type: "expense",
  },
  {
    id: "default-saude",
    name: "Saúde",
    icon: "fa6-solid:briefcase-medical",
    type: "expense",
  },
];

// ✅ NOVAS SUGESTÕES DE RECEITAS
export const suggestedIncomeCategories: DefaultCategory[] = [
  {
    id: "default-salario",
    name: "Salário",
    icon: "fa6-solid:money-check-dollar",
    type: "income",
  },
  {
    id: "default-vendas",
    name: "Vendas",
    icon: "fa6-solid:cash-register",
    type: "income",
  },
  {
    id: "default-rendimentos",
    name: "Rendimentos",
    icon: "fa6-solid:chart-line",
    type: "income",
  },
  {
    id: "default-reembolso",
    name: "Reembolso",
    icon: "fa6-solid:receipt",
    type: "income",
  },
  {
    id: "default-outras-receitas",
    name: "Outras Receitas",
    icon: "fa6-solid:box",
    type: "income",
  },
];

// O resto da sua ótima lista, agora como sugestões de DESPESAS
export const suggestedExpenseCategories: DefaultCategory[] = [
  {
    id: "default-assinaturas",
    name: "Assinaturas",
    icon: "fa6-solid:arrows-rotate",
    type: "expense",
  },
  {
    id: "default-cartao-credito",
    name: "Cartão de Crédito",
    icon: "fa6-solid:credit-card",
    type: "expense",
  },
  {
    id: "default-investimentos",
    name: "Investimentos",
    icon: "fa6-solid:arrow-trend-up",
    type: "expense",
  },
  {
    id: "default-educacao",
    name: "Educação",
    icon: "fa6-solid:graduation-cap",
    type: "expense",
  },
  {
    id: "default-academia",
    name: "Academia",
    icon: "fa6-solid:dumbbell",
    type: "expense",
  },
  { id: "default-pets", name: "Pets", icon: "fa6-solid:paw", type: "expense" },
  {
    id: "default-emprestimo",
    name: "Empréstimo",
    icon: "fa6-solid:hand-holding-dollar",
    type: "expense",
  },
  {
    id: "default-financiamento",
    name: "Financiamento",
    icon: "fa6-solid:file-contract",
    type: "expense",
  },
  {
    id: "default-outras-despesas",
    name: "Outras Despesas",
    icon: "fa6-solid:box-archive",
    type: "expense",
  },
];
/* prettier-ignore-end */

// ✅ JUNTANDO TODAS AS SUGESTÕES EM UMA SÓ LISTA
export const suggestedCategories: DefaultCategory[] = [
  ...suggestedIncomeCategories,
  ...suggestedExpenseCategories,
];

// Formas de Pagamento Padrão
export const defaultPaymentMethods = [
  {
    id: "default-dinheiro",
    name: "Dinheiro",
    description: "Pagamento em Dinheiro",
    icon: "fa6-solid:money-bill-wave",
  },
  {
    id: "default-pix",
    name: "PIX",
    description: "Pagamento em PIX",
    icon: "fa6-brands:pix",
  },
  {
    id: "default-cartao-credito-pm",
    name: "Crédito",
    description: "Pagamento com Cartão de Crédito",
    icon: "fa6-solid:credit-card",
    aliases: ["Cartão de Crédito"],
  },
  {
    id: "default-cartao-debito",
    name: "Débito",
    description: "Pagamento com Cartão de Débito",
    icon: "fa6-solid:id-card",
    aliases: ["Cartão de Débito"],
  },
  {
    id: "default-boleto",
    name: "Boleto",
    description: "Pagamento de Boleto",
    icon: "fa6-solid:barcode",
  },
];

// Conta Padrão
export const defaultAccount = {
  id: "default-carteira",
  name: "Carteira",
  balance: 0,
  icon: "fa6-solid:wallet",
};
