// src/app/extrato/page.tsx
"use client";

import { ExtratoView } from "@/components/extrato/extrato-view";
import { MainLayout } from "@/components/layout/main-layout";
import { PageViewLayout } from "@/components/layout/page-view-layout";

export default function ExtratoPage() {
  return (
    <MainLayout>
      <PageViewLayout
        title="Extrato"
        subtitle="Filtre e analise seus lançamentos"
      >
        <ExtratoView />
      </PageViewLayout>
    </MainLayout>
  );
}
