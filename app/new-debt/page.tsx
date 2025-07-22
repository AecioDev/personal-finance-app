// app/new-debt/page.tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { DebtForm } from "@/components/debts/debt-form";
import { MainLayout } from "@/components/layout/main-layout";

export default function DebtsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <DebtForm />
      </MainLayout>
    </AuthGuard>
  );
}
