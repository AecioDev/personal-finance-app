import { AuthGuard } from "@/components/auth/auth-guard"
import { MainLayout } from "@/components/layout/main-layout"
import { ReportsView } from "@/components/reports/reports-view"

export default function ReportsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <ReportsView />
      </MainLayout>
    </AuthGuard>
  )
}
