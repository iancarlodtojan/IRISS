import DashboardLayout from "../components/layout/DashboardLayout";
import { DollarSign, Package } from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* TITLE */}
      <h1 className="mb-8 text-4xl font-black">DASHBOARD</h1>

      {/* CARDS */}
      <div className="mb-8 grid grid-cols-2 gap-10">
        {/* SALES */}
        <div className="flex h-[105px] items-center justify-between rounded-2xl bg-[#f4f4f4] px-6 shadow-md">
          <div>
            <p className="text-sm text-gray-600">Total Sales</p>
            <h2 className="text-4xl font-black">$10,267</h2>
          </div>

          <DollarSign className="h-10 w-10" />
        </div>

        {/* STOCK */}
        <div className="flex h-[105px] items-center justify-between rounded-2xl bg-[#f4f4f4] px-6 shadow-md">
          <div>
            <p className="text-sm text-gray-600">
              Products in Stock
            </p>

            <h2 className="text-4xl font-black">178</h2>
          </div>

          <Package className="h-9 w-9" />
        </div>
      </div>

      {/* SALES TREND */}
      <div className="mb-8 h-[260px] rounded-2xl bg-[#f4f4f4] p-8 shadow-md">
        <h2 className="text-2xl font-bold">Sales Trend</h2>
      </div>

      {/* TOP PRODUCTS */}
      <div className="h-[220px] rounded-2xl bg-[#f4f4f4] p-8 shadow-md">
        <h2 className="text-2xl font-bold">Top Products</h2>
      </div>
    </DashboardLayout>
  );
}