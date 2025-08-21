// app/debts/[debtId]/edit/page.tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { DebtEditView } from "@/components/debts/debt-edit-view";
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
        <DebtEditView debtId={params.debtId} />
      </MainLayout>
    </AuthGuard>
  );
}
