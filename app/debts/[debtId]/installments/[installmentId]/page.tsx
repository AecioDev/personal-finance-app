import { AuthGuard } from "@/components/auth/auth-guard";
import { InstallmentPaymentView } from "@/components/debts/installment-payment-view";
import { MainLayout } from "@/components/layout/main-layout";

export default function InstallmentPaymentPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <InstallmentPaymentView />
      </MainLayout>
    </AuthGuard>
  );
}
