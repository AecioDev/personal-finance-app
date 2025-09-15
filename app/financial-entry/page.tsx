import { AuthGuard } from "@/components/auth/auth-guard";
import { FinancialEntryView } from "@/components/financial-entries/financial-entry-view";
import { MainLayout } from "@/components/layout/main-layout";
import { Suspense } from "react";

function FinancialEntryPageContent() {
  return (
    <AuthGuard>
      <MainLayout>
        <FinancialEntryView />
      </MainLayout>
    </AuthGuard>
  );
}

export default function FinancialEntryPage() {
  return (
    <Suspense>
      <FinancialEntryPageContent />
    </Suspense>
  );
}
