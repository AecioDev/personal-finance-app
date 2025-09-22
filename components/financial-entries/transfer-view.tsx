// in: components/financial-entries/transfer-view.tsx

"use client";

import { useRouter } from "next/navigation";
import { PageViewLayout } from "../layout/page-view-layout";
import { TransferForm } from "./forms/transfer-form";

export function TransferView() {
  const router = useRouter();

  return (
    <PageViewLayout
      title="Nova Transferência"
      subtitle="Mova dinheiro entre suas contas"
    >
      <TransferForm onFinished={() => router.back()} />
    </PageViewLayout>
  );
}
