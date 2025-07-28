// app/debts/[debtId]/edit/page.tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { DebtForm } from "@/components/debts/debt-form";
import { MainLayout } from "@/components/layout/main-layout";

interface DebtDetailsPageProps {
  params: {
    debtId: string;
  };
}

export default function DebtDetailsPage({ params }: DebtDetailsPageProps) {
  return (
    <AuthGuard>
      <MainLayout>
        <DebtForm debtId={params.debtId} />
      </MainLayout>
    </AuthGuard>
  );
}
