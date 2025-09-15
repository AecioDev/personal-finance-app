/**
 * Este arquivo centraliza os dados padrão para novos usuários
 * ou para a sincronização de contas existentes.
 */
// src/lib/data/defaults.ts
interface DefaultCategory {
  id: string;
  name: string;
  icon: string;
}

// Apenas as categorias mais comuns que todo usuário começa usando
/* prettier-ignore-start */
export const essentialCategories: DefaultCategory[] = [
  { id: "default-moradia", name: "Moradia", icon: "fa6-solid:house-chimney" },
  {
    id: "default-alimentacao",
    name: "Alimentação",
    icon: "fa6-solid:utensils",
  },
  {
    id: "default-contas",
    name: "Contas e Serviços",
    icon: "fa6-solid:file-invoice-dollar",
  },
  { id: "default-transporte", name: "Transporte", icon: "fa6-solid:bus" },
  { id: "default-compras", name: "Compras", icon: "fa6-solid:bag-shopping" },
  {
    id: "default-lazer",
    name: "Lazer",
    icon: "fa6-solid:martini-glass-citrus",
  },
  { id: "default-saude", name: "Saúde", icon: "fa6-solid:briefcase-medical" },
];

// O resto da sua ótima lista, agora como sugestões
export const suggestedCategories: DefaultCategory[] = [
  {
    id: "default-assinaturas",
    name: "Assinaturas",
    icon: "fa6-solid:arrows-rotate",
  },
  {
    id: "default-cartao-credito",
    name: "Cartão de Crédito",
    icon: "fa6-solid:credit-card",
  },
  {
    id: "default-investimentos",
    name: "Investimentos",
    icon: "fa6-solid:arrow-trend-up",
  },
  {
    id: "default-educacao",
    name: "Educação",
    icon: "fa6-solid:graduation-cap",
  },
  { id: "default-academia", name: "Academia", icon: "fa6-solid:dumbbell" },
  { id: "default-pets", name: "Pets", icon: "fa6-solid:paw" },
  {
    id: "default-emprestimo",
    name: "Empréstimo",
    icon: "fa6-solid:hand-holding-dollar",
  },
  {
    id: "default-financiamento",
    name: "Financiamento",
    icon: "fa6-solid:file-contract",
  },
  {
    id: "default-outras-despesas",
    name: "Outras Despesas",
    icon: "fa6-solid:box-archive",
  },
];
/* prettier-ignore-end */

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
