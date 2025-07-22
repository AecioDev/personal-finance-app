import { AuthGuard } from "@/components/auth/auth-guard";
import { MainLayout } from "@/components/layout/main-layout";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default function NewTransactionPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <TransactionForm />
      </MainLayout>
    </AuthGuard>
  );
}
