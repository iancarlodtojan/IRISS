import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { adminLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";

import { AlertTriangle, Package, ShoppingCart, Users } from "lucide-react";

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "order_id, invoice_number, total_amount, created_at, customers(customer_name)",
        )
        .order("created_at", { ascending: true });

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          "product_id, product_name, stock_quantity, cost_price, reorder_level, status",
        )
        .eq("status", "active")
        .order("product_name", { ascending: true });

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("user_id, full_name, role, status");

      const { data: movementsData, error: movementsError } = await supabase
        .from("stock_movements")
        .select(
          `
          movement_id,
          movement_type,
          quantity,
          created_at,
          products (
            product_name
          ),
          users (
            full_name
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(4);

      if (ordersError) {
        console.error(ordersError);
        return;
      }

      if (productsError) {
        console.error(productsError);
        return;
      }

      if (usersError) {
        console.error(usersError);
        return;
      }

      if (movementsError) {
        console.error(movementsError);
        return;
      }

      if (!ignore) {
        setOrders(ordersData || []);
        setProducts(productsData || []);
        setUsers(usersData || []);
        setStockMovements(movementsData || []);
      }
    }

    loadDashboardData();

    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        loadDashboardData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        loadDashboardData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        loadDashboardData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_movements" },
        loadDashboardData,
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const totalSales = useMemo(() => {
    return orders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    );
  }, [orders]);

  const totalStock = useMemo(() => {
    return products.reduce(
      (sum, product) => sum + Number(product.stock_quantity || 0),
      0,
    );
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          Number(product.stock_quantity || 0) <=
          Number(product.reorder_level || 10),
      )
      .sort(
        (a, b) => Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0),
      );
  }, [products]);

  const inventoryValue = useMemo(() => {
    return products.reduce(
      (sum, product) =>
        sum +
        Number(product.cost_price || 0) * Number(product.stock_quantity || 0),
      0,
    );
  }, [products]);

  const salesChartData = useMemo(() => {
    const salesByDate = {};

    orders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString("en-PH", {
        month: "short",
        day: "2-digit",
      });

      salesByDate[date] =
        (salesByDate[date] || 0) + Number(order.total_amount || 0);
    });

    return Object.entries(salesByDate).map(([date, sales]) => ({
      date,
      sales,
    }));
  }, [orders]);

  const recentTransactions = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [orders]);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("en-PH");
  }

  function formatDateTime(dateValue) {
    return new Date(dateValue).toLocaleString("en-PH", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getMovementDisplay(type) {
    if (type === "restock") {
      return {
        icon: "🟢",
        label: "Restock",
      };
    }

    if (type === "sale") {
      return {
        icon: "🔴",
        label: "Sale",
      };
    }

    if (type === "initial_stock") {
      return {
        icon: "🔵",
        label: "Added Product",
      };
    }

    if (type === "adjustment") {
      return {
        icon: "🟡",
        label: "Adjustment",
      };
    }

    return {
      icon: "⚪",
      label: "Update",
    };
  }

  return (
    <AppLayout links={adminLinks}>
      <div className="mb-8">
        <h1 className="text-4xl font-black">ADMIN DASHBOARD</h1>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-5">
        <div className="rounded-2xl bg-[#3693a8] p-5 text-white shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm">Total Sales</p>
            <div className="text-3xl font-light">₱</div>
          </div>

          <h2 className="text-3xl font-black">₱{formatCurrency(totalSales)}</h2>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Inventory Value</p>
            <Package className="h-6 w-6" />
          </div>

          <h2 className="text-3xl font-black">
            ₱{formatCurrency(inventoryValue)}
          </h2>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Stock</p>
            <ShoppingCart className="h-6 w-6" />
          </div>

          <h2 className="text-3xl font-black">{totalStock}</h2>
        </div>

        <div className="rounded-2xl bg-[#fff5f5] p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-red-500">Low Stock Alerts</p>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>

          <h2 className="text-3xl font-black text-red-500">
            {lowStockProducts.length}
          </h2>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-[1.4fr_0.8fr] gap-6">
        <div className="h-fit rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Sales Overview</h2>
              <p className="text-sm text-gray-500">Based on saved invoices</p>
            </div>

            <div className="rounded-full bg-[#3693a8]/10 px-4 py-1 text-sm font-semibold text-[#3693a8]">
              {orders.length} invoices
            </div>
          </div>

          {salesChartData.length <= 1 ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              Not enough sales data yet.
            </div>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eeeeee"
                  />

                  <XAxis dataKey="date" axisLine={false} tickLine={false} />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₱${Number(value).toLocaleString("en-PH")}`
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      `₱${Number(value).toLocaleString("en-PH")}`,
                      "Sales",
                    ]}
                  />

                  <Bar
                    dataKey="sales"
                    fill="#3693a8"
                    radius={[10, 10, 0, 0]}
                    barSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-black">System Users</h2>
            <p className="text-sm text-gray-500">Registered system accounts</p>
          </div>

          <div className="mb-5 rounded-2xl bg-[#3693a8]/10 p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#3693a8]">
                Total Users
              </p>
              <Users className="h-7 w-7 text-[#3693a8]" />
            </div>

            <h3 className="text-4xl font-black">{users.length}</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["admin", "cashier", "logistics"].map((role) => {
              const count = users.filter((user) => user.role === role).length;

              return (
                <div
                  key={role}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center"
                >
                  <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                    {role}
                  </p>

                  <p className="text-3xl font-black">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid items-start grid-cols-[1fr_0.9fr] gap-6">
        <div className="h-fit rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-black">Recent Transactions</h2>
            <p className="text-sm text-gray-500">Latest saved invoices</p>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              No transactions yet.
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[190px_1fr_120px] gap-4 border-b border-gray-200 pb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                <p>Invoice</p>
                <p>Customer</p>
                <p className="text-right">Amount</p>
              </div>

              <div className="divide-y divide-gray-200">
                {recentTransactions.map((order) => (
                  <div
                    key={order.order_id}
                    className="grid grid-cols-[190px_1fr_120px] items-center gap-4 py-4 text-sm"
                  >
                    <p className="truncate font-semibold">
                      {order.invoice_number}
                    </p>

                    <p className="truncate text-gray-700">
                      {order.customers?.customer_name || "Walk-in"}
                    </p>

                    <p className="text-right font-semibold">
                      ₱{Number(order.total_amount).toLocaleString("en-PH")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-black">Recent Stock Activity</h2>
            <p className="text-sm text-gray-500">Inventory movement log</p>
          </div>

          {stockMovements.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              No stock activity yet.
            </div>
          ) : (
            <div className="space-y-4">
              {stockMovements.map((movement) => (
                <div
                  key={movement.movement_id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const movementDisplay = getMovementDisplay(
                        movement.movement_type,
                      );

                      return (
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {movementDisplay.icon}
                          </span>

                          <div>
                            <p className="font-bold">{movementDisplay.label}</p>

                            <p className="text-sm text-gray-500">
                              {movement.quantity}{" "}
                              {movement.products?.product_name ||
                                "Unknown Product"}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <p className="text-sm text-gray-500">
                        {movement.quantity}{" "}
                        {movement.products?.product_name || "Unknown Product"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    {formatDateTime(movement.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
