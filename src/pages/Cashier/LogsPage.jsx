import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { cashierLinks } from "../../constants/sidebarLinks";
import { Filter } from "lucide-react";

export default function LogsPage() {
  return (
    <AppLayout links={cashierLinks}>
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-4xl font-black">LOGBOOK</h1>

        <button
          type="button"
          className="flex items-center gap-3 rounded-xl bg-[#9ed5d9] px-5 py-2 text-sm italic text-white shadow-md transition hover:scale-105"
        >
          Filter...
          <Filter className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* LOG TABLE */}
      <div className="min-h-[650px] rounded-2xl bg-[#f4f4f4] px-2 py-4 shadow-md">
        {/* TABLE HEADER */}
        <div className="grid grid-cols-3 border-b border-gray-300 px-10 pb-5 text-sm text-black">
          <p>Date</p>
          <p>Invoice No.</p>
          <p>Customer</p>
        </div>

        {/* EMPTY ROW LINES */}
        <div className="border-b border-gray-300 px-10 py-10" />
        <div className="border-b border-gray-300 px-10 py-10" />
        <div className="border-b border-gray-300 px-10 py-10" />
      </div>
    </AppLayout>
  );
}