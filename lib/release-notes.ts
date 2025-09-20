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

  // A versão antiga continua aqui para referência
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
