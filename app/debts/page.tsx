// app/debt/page.tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { DebtsView } from "@/components/debts/debts-view";
import { MainLayout } from "@/components/layout/main-layout";

export default function DebtsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <DebtsView />
      </MainLayout>
    </AuthGuard>
  );
}
