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
import { cashierLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";

import { AlertTriangle, Package, ShoppingCart } from "lucide-react";

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

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
        .select("product_id, product_name, stock_quantity, reorder_level");

      const { data: orderItemsData, error: orderItemsError } =
        await supabase.from("order_items").select(`
          product_id,
          quantity,
          products (
            product_name
          )
        `);

      if (ordersError) {
        console.error(ordersError);
        return;
      }

      if (productsError) {
        console.error(productsError);
        return;
      }

      if (orderItemsError) {
        console.error(orderItemsError);
        return;
      }

      if (!ignore) {
        setOrders(ordersData || []);
        setProducts(productsData || []);
        setOrderItems(orderItemsData || []);
      }
    }

    loadDashboardData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        loadDashboardData,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        loadDashboardData,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        loadDashboardData,
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const todayString = new Date().toDateString();

  const totalSales = useMemo(() => {
    return orders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    );
  }, [orders]);

  const totalStocks = useMemo(() => {
    return products.reduce(
      (sum, product) => sum + Number(product.stock_quantity || 0),
      0,
    );
  }, [products]);

  const todaysTransactions = useMemo(() => {
    return orders.filter(
      (order) => new Date(order.created_at).toDateString() === todayString,
    ).length;
  }, [orders, todayString]);

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (product) =>
        Number(product.stock_quantity || 0) <=
        Number(product.reorder_level || 10),
    );
  }, [products]);

  const itemsSoldToday = useMemo(() => {
    return orderItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );
  }, [orderItems]);

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

  const topProducts = useMemo(() => {
    const productMap = {};

    orderItems.forEach((item) => {
      const productName = item.products?.product_name || "Unknown Product";

      if (!productMap[productName]) {
        productMap[productName] = 0;
      }

      productMap[productName] += Number(item.quantity || 0);
    });

    return Object.entries(productMap)
      .map(([productName, quantity]) => ({
        productName,
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
  }, [orderItems]);

  const highestProductQuantity = Math.max(
    ...topProducts.map((item) => item.quantity),
    1,
  );

  const recentTransactions = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [orders]);

  return (
    <AppLayout links={cashierLinks}>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-black">Dashboard</h1>
      </div>

      {/* TOP CARDS */}
      <div className="mb-8 grid grid-cols-4 gap-5">
        <div className="rounded-2xl bg-[#3693a8] p-5 text-white shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm">Total Sales</p>

            <div className="text-3xl font-light">₱</div>
          </div>

          <h2 className="text-3xl font-black">
            ₱{totalSales.toLocaleString("en-PH")}
          </h2>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Products in Stock</p>

            <Package className="h-6 w-6" />
          </div>

          <h2 className="text-3xl font-black">{totalStocks}</h2>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Today's Transactions</p>

            <ShoppingCart className="h-6 w-6" />
          </div>

          <h2 className="text-3xl font-black">{todaysTransactions}</h2>
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

      {/* SALES + TOP PRODUCTS */}
      <div className="mb-8 grid grid-cols-[1.4fr_0.8fr] gap-6">
        {/* SALES CHART */}
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Daily Sales</h2>

              <p className="text-sm text-gray-500">Based on saved invoices</p>
            </div>

            <div className="rounded-full bg-[#3693a8]/10 px-4 py-1 text-sm font-semibold text-[#3693a8]">
              ₱{totalSales.toLocaleString("en-PH")}
            </div>
          </div>

          {salesChartData.length <= 1 ? (
            <div className="flex h-[240px] items-center justify-center text-gray-400">
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

        {/* TOP PRODUCTS */}
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-black">Top Products</h2>

            <p className="text-sm text-gray-500">Most sold items</p>
          </div>

          {topProducts.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-gray-400">
              No product sales yet.
            </div>
          ) : (
            <div className="space-y-6">
              {topProducts.map((item, index) => (
                <div key={item.productName}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3693a8] text-xs font-bold text-white">
                        #{index + 1}
                      </div>

                      <p className="font-semibold">{item.productName}</p>
                    </div>

                    <p className="text-sm text-gray-500">
                      {item.quantity} sold
                    </p>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-[#4AAA5A]"
                      style={{
                        width: `${
                          (item.quantity / highestProductQuantity) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-[1fr_0.9fr] gap-6">
        {/* RECENT TRANSACTIONS */}
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-black">Recent Transactions</h2>

            <p className="text-sm text-gray-500">Latest saved invoices</p>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-gray-400">
              No transactions yet.
            </div>
          ) : (
            <div>
              {/* TABLE HEADER */}
              <div className="grid grid-cols-[190px_1fr_120px] gap-4 border-b border-gray-200 pb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                <p>Invoice</p>

                <p>Customer</p>

                <p className="text-right">Amount</p>
              </div>

              {/* TABLE BODY */}
              <div className="divide-y divide-gray-200">
                {recentTransactions.map((order) => (
                  <div
                    key={order.order_id}
                    className="grid grid-cols-[190px_1fr_120px] items-center gap-4 py-4 text-sm"
                  >
                    {/* INVOICE */}
                    <p className="truncate font-semibold">
                      {order.invoice_number}
                    </p>

                    {/* CUSTOMER */}
                    <p className="truncate text-gray-700">
                      {order.customers?.customer_name || "Walk-in"}
                    </p>

                    {/* AMOUNT */}
                    <p className="text-right font-semibold">
                      ₱{Number(order.total_amount).toLocaleString("en-PH")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* QUICK SUMMARY */}
        <div className="h-fit rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-black">Quick Summary</h2>

            <p className="text-sm text-gray-500">Current system overview</p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Total Invoices</p>

              <p className="text-xl font-black">{orders.length}</p>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Items Sold</p>

              <p className="text-xl font-black">{itemsSoldToday}</p>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
