import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { adminLinks } from "../../constants/sidebarLinks";

export default function AdminDashboardPage() {
  return (
    <AppLayout links={adminLinks}>
      <h1 className="text-4xl font-black">ADMIN DASHBOARD</h1>
    </AppLayout>
  );
}