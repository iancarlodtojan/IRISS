import { useEffect, useMemo, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { cashierLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";
import { Filter, X } from "lucide-react";
import InvoiceDetailsModal from "../../components/modals/InvoiceDetailsModal";

export default function LogsPage() {
  const [orders, setOrders] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);

  const [appliedSortType, setAppliedSortType] = useState("monthly");
  const [appliedYear, setAppliedYear] = useState("2026");
  const [appliedMonth, setAppliedMonth] = useState(5);
  const [appliedDay, setAppliedDay] = useState("");

  const [draftSortType, setDraftSortType] = useState("monthly");
  const [draftYear, setDraftYear] = useState("2026");
  const [draftMonth, setDraftMonth] = useState(5);
  const [draftDay, setDraftDay] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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
          ),
          order_items (
            quantity
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) setOrders(data || []);
    }

    loadOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadOrders)
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const date = new Date(order.created_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      if (year !== Number(appliedYear)) return false;
      if (month !== appliedMonth) return false;

      if (appliedSortType === "daily" && appliedDay) {
        if (day !== Number(appliedDay)) return false;
      }

      if (!term) return true;

      const invoice = order.invoice_number?.toLowerCase() || "";
      const customer = order.customers?.customer_name?.toLowerCase() || "";

      return invoice.includes(term) || customer.includes(term);
    });
  }, [orders, appliedYear, appliedMonth, appliedDay, appliedSortType, searchTerm]);

  const daysInMonth = useMemo(() => {
    return new Date(Number(draftYear), draftMonth, 0).getDate();
  }, [draftYear, draftMonth]);

  function formatDate(dateValue) {
    const date = new Date(dateValue);

    const formattedDate = date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${formattedDate} • ${formattedTime}`;
  }

  async function handleOpenInvoiceDetails(orderId) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        order_id,
        invoice_number,
        total_amount,
        created_at,
        customers (
          customer_name,
          contact_number,
          email
        ),
        order_items (
          order_item_id,
          quantity,
          unit_price,
          subtotal,
          products (
            product_name
          )
        ),
        payments (
          payment_method,
          amount_paid,
          payment_status
        )
      `)
      .eq("order_id", orderId)
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setSelectedInvoice(data);
    setInvoiceDetailsOpen(true);
  }

  function openFilter() {
    setDraftSortType(appliedSortType);
    setDraftYear(appliedYear);
    setDraftMonth(appliedMonth);
    setDraftDay(appliedDay);
    setFilterOpen(true);
  }

  function handleApplyFilter() {
    setAppliedSortType(draftSortType);
    setAppliedYear(draftYear);
    setAppliedMonth(draftMonth);
    setAppliedDay(draftDay);
    setFilterOpen(false);
  }

  return (
    <AppLayout links={cashierLinks} onSearch={setSearchTerm}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black">LOGBOOK</h1>

        <button
          type="button"
          onClick={openFilter}
          className="flex items-center gap-3 rounded-xl bg-[#3693a8] px-5 py-2 text-sm italic text-white shadow-md transition hover:scale-105"
        >
          Filter...
          <Filter className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="min-h-[650px] rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
        <div className="grid grid-cols-[240px_1fr_1fr_140px_160px] border-b border-gray-300 pb-5 text-sm font-semibold text-black">
          <p>Date & Time</p>
          <p className="text-center">Invoice No.</p>
          <p className="text-center">Customer Name</p>
          <p className="text-center">No. of Items</p>
          <p className="text-right">Total</p>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex h-[550px] items-center justify-center text-gray-400">
            No logs found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const totalItems =
                order.order_items?.reduce(
                  (sum, item) => sum + Number(item.quantity || 0),
                  0,
                ) || 0;

              return (
                <button
                  key={order.order_id}
                  type="button"
                  onClick={() => handleOpenInvoiceDetails(order.order_id)}
                  className="grid w-full grid-cols-[240px_1fr_1fr_140px_160px] items-center py-5 text-left text-sm transition hover:bg-white/70"
                >
                  <p className="whitespace-nowrap">{formatDate(order.created_at)}</p>

                  <p className="text-center">{order.invoice_number}</p>

                  <p className="text-center">
                    {order.customers?.customer_name || "Walk-in Customer"}
                  </p>

                  <p className="text-center font-semibold">{totalItems}</p>

                  <p className="text-right font-semibold">
                    ₱{Number(order.total_amount).toFixed(2)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="h-[560px] w-[620px] overflow-hidden rounded-2xl bg-white shadow-2xl">
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

            <div className="h-[calc(560px-80px)] overflow-y-auto px-6 py-5">
              <div className="mb-5">
                <p className="mb-3 font-bold">Sort Type</p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDraftSortType("daily")}
                    className={`rounded-xl border p-4 text-left transition ${
                      draftSortType === "daily" ? "border-black" : "border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">Daily</p>
                    <p className="text-xs text-gray-500">Display invoices by day</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDraftSortType("monthly");
                      setDraftDay("");
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      draftSortType === "monthly" ? "border-black" : "border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">Monthly</p>
                    <p className="text-xs text-gray-500">Display invoices by month</p>
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <p className="mb-3 font-bold">Year</p>

                <input
                  type="number"
                  value={draftYear}
                  onChange={(e) => setDraftYear(e.target.value)}
                  className="h-12 w-[140px] rounded-xl border border-gray-300 px-4 outline-none"
                />
              </div>

              <div className="mb-5">
                <p className="mb-3 font-bold">Month</p>

                <div className="grid grid-cols-4 gap-3">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        setDraftMonth(index + 1);
                        setDraftDay("");
                      }}
                      className={`h-10 rounded-xl border text-sm transition ${
                        draftMonth === index + 1 ? "border-black" : "border-gray-300"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>

              {draftSortType === "daily" && (
                <div className="mb-5">
                  <p className="mb-3 font-bold">Day</p>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: daysInMonth }, (_, index) => {
                      const day = index + 1;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDraftDay(String(day))}
                          className={`h-8 rounded-full border text-xs transition ${
                            Number(draftDay) === day
                              ? "border-black bg-gray-100"
                              : "border-gray-300"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

      <InvoiceDetailsModal
        open={invoiceDetailsOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setInvoiceDetailsOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </AppLayout>
  );
}

