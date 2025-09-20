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
  // No futuro, quando tiver uma nova versão, é só adicionar aqui:
  // [APP_VERSION]: {
  //   title: "🚀 Gráficos no seu Dashboard!",
  //   description: "Agora você pode visualizar suas finanças.",
  //   changes: [ ... ],
  // }
};
