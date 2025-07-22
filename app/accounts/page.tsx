import { AccountsView } from "@/components/accounts/accounts-view";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MainLayout } from "@/components/layout/main-layout";

export default function AccountsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <AccountsView />
      </MainLayout>
    </AuthGuard>
  );
}
