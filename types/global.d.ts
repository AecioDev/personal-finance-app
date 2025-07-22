// types/global.d.ts
// Declarações para variáveis globais injetadas pelo ambiente Canvas.
// Como estamos migrando para process.env, __app_id e __firebase_config não são mais necessários aqui.

// Se você ainda precisar de __app_id para algo específico do Canvas, mantenha-o.
// declare const __app_id: string;
// declare const __firebase_config: string;

// Declaração para o ambiente Node.js/Next.js
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_FIREBASE_CONFIG: string;
    // Adicione outras variáveis de ambiente se tiver
  }
}
