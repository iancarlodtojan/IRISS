import { useEffect, useMemo, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { cashierLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCustomers() {
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          customer_id,
          customer_name,
          contact_number,
          email,
          orders (
            order_id
          )
        `,
        )
        .order("customer_name", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) {
        setCustomers(data || []);
      }
    }

    loadCustomers();

    const channel = supabase
      .channel("customers-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
        },
        () => {
          loadCustomers();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadCustomers();
        },
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter((customer) => {
      const name = customer.customer_name?.toLowerCase() || "";
      const contact = customer.contact_number?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";

      return (
        name.includes(term) ||
        contact.includes(term) ||
        email.includes(term)
      );
    });
  }, [customers, searchTerm]);

  return (
    <AppLayout links={cashierLinks} onSearch={setSearchTerm}>
      <div className="mb-6">
        <h1 className="text-4xl font-black">CUSTOMERS</h1>
      </div>

      <div className="min-h-[650px] rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
        <div className="grid grid-cols-4 border-b border-gray-300 pb-5 text-sm font-semibold text-black">
          <p>Customer Name</p>
          <p className="text-center">Phone Number</p>
          <p className="text-center">Email Address</p>
          <p className="text-center">No. of Receipts</p>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="flex h-[550px] items-center justify-center text-gray-400">
            No customers found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.customer_id}
                className="grid grid-cols-4 items-center py-5 text-sm"
              >
                <p>{customer.customer_name}</p>

                <p className="text-center">
                  {customer.contact_number || "N/A"}
                </p>

                <p className="text-center">{customer.email || "N/A"}</p>

                <p className="text-center font-medium">
                  {customer.orders?.length || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}