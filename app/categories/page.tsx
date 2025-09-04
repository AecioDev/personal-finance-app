import { AuthGuard } from "@/components/auth/auth-guard";
import { CategoryView } from "@/components/categories/category-view";
import { MainLayout } from "@/components/layout/main-layout";

export default function CategoriesPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <CategoryView />
      </MainLayout>
    </AuthGuard>
  );
}
