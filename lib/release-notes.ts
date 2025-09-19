// lib/release-notes.ts

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
  "v1.1.0-category-types": {
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
  // "v1.2.0-dashboard-graphs": {
  //   title: "🚀 Gráficos no seu Dashboard!",
  //   description: "Agora você pode visualizar suas finanças.",
  //   changes: [ ... ],
  // }
};
