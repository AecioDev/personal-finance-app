// lib/release-notes.ts

import { APP_VERSION } from "./constants";

interface ReleaseNote {
  title: string;
  description: string;
  changes: {
    title: string;
    detail: string;
  }[];
  nextStep?: string; // Opcional
}

// Usamos um Record para mapear a versão (string) para o conteúdo da nota
export const releaseNotes: Record<string, ReleaseNote> = {
  [APP_VERSION]: {
    title: "📊 Seus Dados, Suas Regras: Novos Relatórios Inteligentes!",
    description:
      "Analisar suas finanças nunca foi tão fácil e visual. Mergulhe nos seus dados com a nova tela de Relatórios e tome decisões mais inteligentes.",
    changes: [
      {
        title: "Relatório Mensal por Categoria",
        detail:
          "Veja um resumo completo de suas Receitas e Despesas de cada mês, tudo agrupado por categoria para fácil visualização.",
      },
      {
        title: "Gráficos Interativos (Pizza e Barras)",
        detail:
          "Escolha como visualizar seus dados! Alterne entre um gráfico de pizza (rosca) e um gráfico de barras adaptativo e super detalhado.",
      },
      {
        title: "Mergulhe nos Detalhes",
        detail:
          "Ficou curioso com algum gasto? Agora você pode clicar em qualquer categoria na lista para ver todos os lançamentos relacionados àquele item.",
      },
    ],
  },
  "1.3.0": {
    title: "🚀 Controle Total: Transferências e Cartões de Crédito!",
    description:
      "Esta atualização traz duas das funcionalidades mais pedidas para um controle financeiro completo e sem duplicidade.",
    changes: [
      {
        title: "Nova Função de Transferência Entre Contas",
        detail:
          "Agora você pode registrar movimentações entre suas contas (Ex: da conta corrente para a carteira) sem afetar os totais de receitas e despesas.",
      },
      {
        title: "Gestão Inteligente de Cartão de Crédito",
        detail:
          "Cadastre seus cartões como contas, lance os gastos neles e pague a fatura com uma transferência. Diga adeus à dupla contagem de despesas!",
      },
      {
        title: "Guias e Dicas Integradas",
        detail:
          "Adicionamos dicas no app para te ajudar a usar a nova funcionalidade de cartão de crédito da forma correta e aproveitar ao máximo.",
      },
    ],
  },
  "1.2.0": {
    title: "🚀 Uma Nova Experiência Chegou!",
    description:
      "Fizemos grandes melhorias para deixar seu controle financeiro ainda mais poderoso e agradável de usar.",
    changes: [
      {
        title: "Jornada de Inicialização Inteligente",
        detail:
          "Agora o app te recebe com uma nova tela de boas-vindas que mostra as novidades e te ajuda a configurar o app.",
      },
      {
        title: "Instalação no iOS Facilitada",
        detail:
          "Usuários de iPhone e iPad agora recebem instruções claras de como instalar o app na tela de início.",
      },
      {
        title: "Preferências Customizáveis",
        detail:
          "Você agora pode desativar a animação de inicialização e encontrar dicas de uso diretamente no seu Perfil.",
      },
      {
        title: "Exclusão Segura e Estorno de Pagamentos",
        detail:
          "Adicionamos a função de estornar pagamentos e implementamos travas de segurança para impedir a exclusão de dados em uso.",
      },
      {
        title: "Layout Refinado e Responsivo",
        detail:
          "Melhoramos a interface em várias telas, garantindo uma ótima experiência tanto no celular quanto no computador.",
      },
    ],
  },
  "1.1.0": {
    title: "🎉 Boas notícias! O app evoluiu!",
    description: "Preparamos algumas melhorias para você:",
    changes: [
      {
        title: "Correção no Cadastro de Receitas",
        detail: "Agora o fluxo de salvar está mais robusto e livre de bugs.",
      },
      {
        title: "Criação do Tipo de Categorias",
        detail:
          "Suas categorias agora podem ser de 'Receita' ou 'Despesa', para uma organização muito melhor.",
      },
    ],
  },
};
