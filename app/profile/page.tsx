import { AuthGuard } from "@/components/auth/auth-guard"
import { MainLayout } from "@/components/layout/main-layout"
import { ProfileView } from "@/components/profile/profile-view"

export default function ProfilePage() {
  return (
    <AuthGuard>
      <MainLayout>
        <ProfileView />
      </MainLayout>
    </AuthGuard>
  )
}
