import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Lê a variável de ambiente (agora com NEXT_PUBLIC_)
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  // Se o modo manutenção estiver desativado, não faz nada
  if (!maintenanceMode) {
    return NextResponse.next();
  }

  // Se já estiver na página de manutenção, permite o acesso para evitar loop infinito
  if (request.nextUrl.pathname === "/maintenance") {
    return NextResponse.next();
  }

  // Redireciona qualquer outra rota para a página de manutenção
  return NextResponse.redirect(new URL("/maintenance", request.url));
}

// Configuração para o middleware não rodar em rotas de API, arquivos, etc.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|maintenance).*)"],
};
