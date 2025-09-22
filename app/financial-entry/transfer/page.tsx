// in: app/financial-entry/transfer/page.tsx

import { AuthGuard } from "@/components/auth/auth-guard";
import { TransferView } from "@/components/financial-entries/transfer-view";
import { MainLayout } from "@/components/layout/main-layout";
import { Suspense } from "react";

function TransferPageContent() {
  return (
    <AuthGuard>
      <MainLayout>
        <TransferView />
      </MainLayout>
    </AuthGuard>
  );
}

export default function TransferPage() {
  return (
    <Suspense>
      <TransferPageContent />
    </Suspense>
  );
}
