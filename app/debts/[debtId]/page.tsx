// app/debts/[debtId]/page.tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { DebtDetailsView } from "@/components/debts/debt-details-view";
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
        <DebtDetailsView debtId={params.debtId} />
      </MainLayout>
    </AuthGuard>
  );
}
