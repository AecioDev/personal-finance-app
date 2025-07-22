// app/payment-methods/page.tsx
import { PaymentMethodsView } from "@/components/payment-methods/payment-methods-view";
import { MainLayout } from "@/components/layout/main-layout"; // Se você usa um layout principal
import { AuthGuard } from "@/components/auth/auth-guard";

export default function PaymentMethodsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <PaymentMethodsView />
      </MainLayout>
    </AuthGuard>
  );
}
