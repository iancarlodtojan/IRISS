import { useEffect, useMemo, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { cashierLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";
import { Filter, X } from "lucide-react";

export default function LogsPage() {
  const [orders, setOrders] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [sortType, setSortType] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState(5);
  const [selectedDay, setSelectedDay] = useState("");

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          order_id,
          invoice_number,
          total_amount,
          created_at,
          customers (
            customer_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) {
        setOrders(data || []);
      }
    }

    loadOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const date = new Date(order.created_at);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      if (year !== Number(selectedYear)) return false;

      if (month !== selectedMonth) return false;

      if (sortType === "daily" && selectedDay) {
        return day === Number(selectedDay);
      }

      return true;
    });
  }, [
    orders,
    selectedYear,
    selectedMonth,
    selectedDay,
    sortType,
  ]);

  const daysInMonth = useMemo(() => {
    return new Date(
      Number(selectedYear),
      selectedMonth,
      0
    ).getDate();
  }, [selectedYear, selectedMonth]);

  function formatDate(dateValue) {
    return new Date(dateValue).toLocaleDateString("en-PH");
  }

  function handleApplyFilter() {
    setFilterOpen(false);
  }

  return (
    <AppLayout links={cashierLinks}>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black">LOGBOOK</h1>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-3 rounded-xl bg-[#3693a8] px-5 py-2 text-sm italic text-white shadow-md transition hover:scale-105"
        >
          Filter...
          <Filter className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* TABLE */}
      <div className="min-h-[650px] rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
        {/* TABLE HEADER */}
        <div className="grid grid-cols-[160px_1fr_1fr_160px] border-b border-gray-300 pb-5 text-sm font-semibold text-black">
          <p>Date</p>

          <p className="text-center">Invoice No.</p>

          <p className="text-center">Customer</p>

          <p className="text-right">Total</p>
        </div>

        {/* ORDERS */}
        {filteredOrders.length === 0 ? (
          <div className="flex h-[550px] items-center justify-center text-gray-400">
            No logs found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div
                key={order.order_id}
                className="grid grid-cols-[160px_1fr_1fr_160px] items-center py-5 text-sm"
              >
                {/* DATE */}
                <p>{formatDate(order.created_at)}</p>

                {/* INVOICE */}
                <p className="text-center">
                  {order.invoice_number}
                </p>

                {/* CUSTOMER */}
                <p className="text-center">
                  {order.customers?.customer_name ||
                    "Walk-in Customer"}
                </p>

                {/* TOTAL */}
                <p className="text-right font-semibold">
                  ₱{Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTER MODAL */}
      {filterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="h-[560px] w-[620px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
              <h2 className="text-2xl font-black">Filters</h2>

              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="transition hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="h-[calc(560px-80px)] overflow-y-auto px-6 py-5">
              {/* SORT TYPE */}
              <div className="mb-5">
                <p className="mb-3 font-bold">Sort Type</p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSortType("daily")}
                    className={`rounded-xl border p-4 text-left transition ${
                      sortType === "daily"
                        ? "border-black"
                        : "border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">Daily</p>

                    <p className="text-xs text-gray-500">
                      Display invoices by day
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortType("monthly");
                      setSelectedDay("");
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      sortType === "monthly"
                        ? "border-black"
                        : "border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">Monthly</p>

                    <p className="text-xs text-gray-500">
                      Display invoices by month
                    </p>
                  </button>
                </div>
              </div>

              {/* YEAR */}
              <div className="mb-5">
                <p className="mb-3 font-bold">Year</p>

                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(e.target.value)
                  }
                  className="h-12 w-[140px] rounded-xl border border-gray-300 px-4 outline-none"
                />
              </div>

              {/* MONTH */}
              <div className="mb-5">
                <p className="mb-3 font-bold">Month</p>

                <div className="grid grid-cols-4 gap-3">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(index + 1);
                        setSelectedDay("");
                      }}
                      className={`h-10 rounded-xl border text-sm transition ${
                        selectedMonth === index + 1
                          ? "border-black"
                          : "border-gray-300"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>

              {/* DAY */}
              {sortType === "daily" && (
                <div className="mb-5">
                  <p className="mb-3 font-bold">Day</p>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from(
                      { length: daysInMonth },
                      (_, index) => {
                        const day = index + 1;

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              setSelectedDay(String(day))
                            }
                            className={`h-8 rounded-full border text-xs transition ${
                              Number(selectedDay) === day
                                ? "border-black bg-gray-100"
                                : "border-gray-300"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* SAVE BUTTON */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="rounded-xl bg-[#3693a8] px-7 py-2.5 text-sm text-white shadow-md transition hover:scale-105"
                >
                  Save...
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
