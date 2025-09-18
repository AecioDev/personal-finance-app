import { AuthGuard } from "@/components/auth/auth-guard";
import { FinancialEntryEditView } from "@/components/financial-entries/financial-entry-edit-view";
import { MainLayout } from "@/components/layout/main-layout";
import { Suspense } from "react";

function FinancialEntryEditPageContent() {
  return (
    <AuthGuard>
      <MainLayout>
        <FinancialEntryEditView />
      </MainLayout>
    </AuthGuard>
  );
}

export default function FinancialEntryEditPage() {
  return (
    <Suspense>
      <FinancialEntryEditPageContent />
    </Suspense>
  );
}
