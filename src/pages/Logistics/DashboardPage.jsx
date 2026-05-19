import { useEffect, useMemo, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { logisticsLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";
import { AlertTriangle, Boxes, Package, Wallet } from "lucide-react";

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          "product_id, product_name, stock_quantity, cost_price, selling_price, reorder_level, status"
        )
        .eq("status", "active")
        .order("product_name", { ascending: true });

      const { data: movementsData, error: movementsError } = await supabase
        .from("stock_movements")
        .select(`
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
        `)
        .order("created_at", { ascending: false })
        .limit(3);

      if (productsError) {
        console.error(productsError);
        return;
      }

      if (movementsError) {
        console.error(movementsError);
        return;
      }

      if (!ignore) {
        setProducts(productsData || []);
        setStockMovements(movementsData || []);
      }
    }

    loadDashboardData();

    const channel = supabase
      .channel("logistics-dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        loadDashboardData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_movements",
        },
        loadDashboardData
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const totalProducts = useMemo(() => {
    return products.length;
  }, [products]);

  const totalStocks = useMemo(() => {
    return products.reduce(
      (sum, product) => sum + Number(product.stock_quantity || 0),
      0
    );
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products
      .filter((product) => {
        const stock = Number(product.stock_quantity || 0);
        const reorderLevel = Number(product.reorder_level || 10);

        return stock > 0 && stock <= reorderLevel;
      })
      .sort(
        (a, b) => Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0)
      );
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter(
      (product) => Number(product.stock_quantity || 0) === 0
    );
  }, [products]);

  const inventoryValue = useMemo(() => {
    return products.reduce((sum, product) => {
      const stock = Number(product.stock_quantity || 0);
      const cost = Number(product.cost_price || 0);

      return sum + stock * cost;
    }, 0);
  }, [products]);

  function formatMovementType(type) {
    if (type === "restock") return "Restocked";
    if (type === "sale") return "Sold";
    if (type === "initial_stock") return "Initial Stock";
    if (type === "adjustment") return "Adjusted";

    return "Updated";
  }

  function formatDateTime(dateValue) {
    return new Date(dateValue).toLocaleString("en-PH", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AppLayout links={logisticsLinks}>
      <h1 className="mb-8 text-4xl font-black">DASHBOARD</h1>

      {/* INVENTORY CARDS */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        <div className="rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Products</p>
            <Package className="h-7 w-7" />
          </div>

          <h2 className="text-4xl font-black">{totalProducts}</h2>
        </div>

        <div className="rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Products in Stock</p>
            <Boxes className="h-7 w-7" />
          </div>

          <h2 className="text-4xl font-black">{totalStocks}</h2>
        </div>

        <div className="rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Low Stock Items</p>
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="text-4xl font-black text-[#F78D41]">
            {lowStockProducts.length}
          </h2>
        </div>

        <div className="rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Inventory Value</p>
            <Wallet className="h-7 w-7" />
          </div>

          <h2 className="text-3xl font-black">
            ₱{inventoryValue.toLocaleString("en-PH")}
          </h2>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-8">
        {/* LOW STOCK PRODUCTS */}
        <div className="rounded-2xl bg-[#f4f4f4] p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Low Stock Products</h2>

            <p className="text-sm text-gray-500">
              Needs restocking soon
            </p>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-gray-400">
              No low stock products.
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.slice(0, 6).map((product) => (
                <div
                  key={product.product_id}
                  className="grid grid-cols-[1fr_110px_130px] items-center rounded-xl bg-white px-5 py-4 shadow-sm"
                >
                  <div>
                    <p className="font-bold">{product.product_name}</p>

                    
                  </div>

                  <p className="text-center text-sm font-semibold">
                    {product.stock_quantity} left
                  </p>

                  <div className="flex justify-end">
                    <span className="rounded-full bg-[#F78D41] px-4 py-1 text-xs font-bold text-white">
                      Low Stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT STOCK MOVEMENTS */}
        <div className="rounded-2xl bg-[#f4f4f4] p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Stock Movements</h2>
          </div>

          {stockMovements.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-gray-400">
              No stock movements yet.
            </div>
          ) : (
            <div className="space-y-4">
              {stockMovements.map((movement) => (
                <div
                  key={movement.movement_id}
                  className="rounded-xl bg-white px-5 py-4 shadow-sm"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-bold">
                      {formatMovementType(movement.movement_type)}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatDateTime(movement.created_at)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">
                    {movement.quantity}{" "}
                    {movement.products?.product_name || "Unknown Product"}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    By {movement.users?.full_name || "User"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OUT OF STOCK SECTION */}
      {outOfStockProducts.length > 0 && (
        <div className="mt-8 rounded-2xl bg-[#f4f4f4] p-8 shadow-md">
          <h2 className="mb-6 text-2xl font-bold">Out of Stock</h2>

          <div className="grid grid-cols-3 gap-4">
            {outOfStockProducts.slice(0, 6).map((product) => (
              <div
                key={product.product_id}
                className="rounded-xl bg-white px-5 py-4 shadow-sm"
              >
                <p className="font-bold">{product.product_name}</p>

                <p className="mt-1 text-sm text-red-500">
                  Currently unavailable
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}