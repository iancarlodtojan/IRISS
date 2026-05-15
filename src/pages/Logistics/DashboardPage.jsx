import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { logisticsLinks } from "../../constants/sidebarLinks";

export default function LogisticsDashboardPage() {
  return (
    <AppLayout links={logisticsLinks}>
      <h1 className="text-4xl font-black">LOGISTICS DASHBOARD</h1>
    </AppLayout>
  );
}