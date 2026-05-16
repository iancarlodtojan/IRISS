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
import { Package } from "lucide-react";

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("order_id, total_amount, created_at")
        .order("created_at", { ascending: true });

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("product_id, stock_quantity");

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

  const averageSale = useMemo(() => {
    if (orders.length === 0) return 0;

    const salesByDate = {};

    orders.forEach((order) => {
      const date = new Date(order.created_at).toDateString();

      salesByDate[date] =
        (salesByDate[date] || 0) + Number(order.total_amount || 0);
    });

    const totalDays = Object.keys(salesByDate).length;

    return totalDays === 0 ? 0 : totalSales / totalDays;
  }, [orders, totalSales]);

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

  return (
    <AppLayout links={cashierLinks}>
      <h1 className="mb-8 text-4xl font-black">DASHBOARD</h1>

      <div className="mb-8 grid grid-cols-2 gap-10">
        <div className="flex h-[105px] items-center justify-between rounded-2xl bg-[#f4f4f4] px-6 shadow-md">
          <div>
            <p className="text-sm text-gray-600">Total Sales</p>

            <h2 className="text-4xl font-black">
              ₱{totalSales.toLocaleString("en-PH")}
            </h2>
          </div>

          <div className="text-5xl font-light">₱</div>
        </div>

        <div className="flex h-[105px] items-center justify-between rounded-2xl bg-[#f4f4f4] px-6 shadow-md">
          <div>
            <p className="text-sm text-gray-600">Products in Stock</p>

            <h2 className="text-4xl font-black">{totalStocks}</h2>
          </div>

          <Package className="h-9 w-9" />
        </div>
      </div>

      <div className="mb-8 rounded-2xl bg-[#f4f4f4] p-8 shadow-md">
        <h2 className="mb-6 text-2xl font-bold">Sales Summary</h2>

        <div className="mb-8 grid grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm text-gray-500">Today's Sales</p>

            <h3 className="text-3xl font-black">
              ₱{totalSales.toLocaleString("en-PH")}
            </h3>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm text-gray-500">Transactions</p>

            <h3 className="text-3xl font-black">{orders.length}</h3>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm text-gray-500">Average Daily Sales</p>

            <h3 className="text-3xl font-black">
              ₱
              {averageSale.toLocaleString("en-PH", {
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold">Daily Sales</h3>

            <p className="text-sm text-gray-500">Based on saved invoices</p>
          </div>

          {salesChartData.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-gray-400">
              No sales data yet.
            </div>
          ) : (
            <div className="mx-auto h-[220px] max-w-[850px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
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
                    cursor={{ fill: "#f3f4f6" }}
                    formatter={(value) => [
                      `₱${Number(value).toLocaleString("en-PH")}`,
                      "Sales",
                    ]}
                  />

                  <Bar
                    dataKey="sales"
                    fill="#3693a8"
                    radius={[12, 12, 0, 0]}
                    barSize={55}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-[#f4f4f4] p-8 shadow-md">
        <h2 className="mb-6 text-2xl font-bold">Top Products</h2>

        {topProducts.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center text-gray-400">
            No product sales yet.
          </div>
        ) : (
          <div className="space-y-5">
            {topProducts.map((item, index) => (
              <div key={item.productName}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3693a8] text-xs font-bold text-white">
                      #{index + 1}
                    </div>

                    <p className="font-semibold">{item.productName}</p>
                  </div>

                  <p className="text-sm text-gray-500">{item.quantity} sold</p>
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
    </AppLayout>
  );
}
