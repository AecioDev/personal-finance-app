import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { MainLayout } from "@/components/layout/main-layout";

export default function Home() {
  return (
    <AuthGuard>
      <MainLayout>
        <DashboardView />
      </MainLayout>
    </AuthGuard>
  );
}
