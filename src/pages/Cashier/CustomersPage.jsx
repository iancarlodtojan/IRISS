import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { cashierLinks } from "../../constants/sidebarLinks";

export default function CustomersPage() {
  return (
    <AppLayout links={cashierLinks}>
      <h1 className="mb-5 text-4xl font-black">CUSTOMERS</h1>

      <div className="min-h-[650px] rounded-2xl bg-[#f4f4f4] px-4 py-4 shadow-md">
        <div className="grid grid-cols-4 border-b border-gray-300 px-10 pb-5 text-sm text-black">
          <p>Customer Name</p>
          <p>Phone Number</p>
          <p>Email Address</p>
          <p>No. of Receipts</p>
        </div>

        <div className="border-b border-gray-300 px-10 py-14" />
        <div className="border-b border-gray-300 px-10 py-14" />
        <div className="border-b border-gray-300 px-10 py-14" />
        <div className="border-b border-gray-300 px-10 py-14" />
      </div>
    </AppLayout>
  );
}