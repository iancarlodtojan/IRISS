import { useEffect, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { logisticsLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("product_name", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) {
        setProducts(data || []);
      }
    }

    async function loadStockHistoryRealtime() {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
          movement_id,
          movement_type,
          quantity,
          previous_stock,
          new_stock,
          created_at,
          products (
            product_name
          ),
          users (
            full_name,
            role
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) {
        setStockMovements(data || []);
      }
    }

    loadProducts();
    loadStockHistoryRealtime();

    const channel = supabase
      .channel("products-and-history-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadProducts();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_movements",
        },
        () => {
          loadStockHistoryRealtime();
        },
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadStockHistory() {
    const { data, error } = await supabase
      .from("stock_movements")
      .select(
        `
        movement_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        created_at,
        products (
          product_name
        ),
        users (
          full_name,
          role
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setStockMovements(data || []);
    setHistoryOpen(true);
  }

  function formatDateTime(dateValue) {
    return new Date(dateValue).toLocaleString("en-PH", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMovementText(movement) {
    const userRole = movement.users?.role || "User";
    const userName = movement.users?.full_name || userRole;
    const productName = movement.products?.product_name || "Unknown Product";

    if (movement.movement_type === "sale") {
      return `${userName} sold ${movement.quantity} ${productName}.`;
    }

    if (movement.movement_type === "restock") {
      return `${userName} restocked ${movement.quantity} ${productName}.`;
    }

    if (movement.movement_type === "adjustment") {
      return `${userName} adjusted ${productName}.`;
    }

    if (movement.movement_type === "initial_stock") {
      return `${userName} added initial stock for ${productName}.`;
    }

    return `${userName} updated ${productName}.`;
  }

  return (
    <AppLayout links={logisticsLinks}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black">INVENTORY</h1>

        <button
          type="button"
          onClick={loadStockHistory}
          className="rounded-xl bg-[#3693a8] px-5 py-2 text-sm text-white shadow-md transition hover:scale-105"
        >
          Stock History
        </button>
      </div>

      <div className="rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
        <div className="grid grid-cols-5 border-b border-gray-300 pb-5 text-sm font-semibold">
          <p>Product Name</p>
          <p className="text-center">Quantity</p>
          <p className="text-center">Price</p>
          <p className="text-center">Cost</p>
          <p className="text-center">Status</p>
        </div>

        <div className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center text-gray-400">
              No products found.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.product_id}
                className="grid grid-cols-5 items-center py-5 text-sm"
              >
                <p>{product.product_name}</p>

                <p className="text-center">{product.stock_quantity}</p>

                <p className="text-center">
                  ₱{Number(product.selling_price).toFixed(2)}
                </p>

                <p className="text-center">
                  ₱{Number(product.cost_price).toFixed(2)}
                </p>

                <div className="flex justify-center">
                  <span
                    className={`inline-block min-w-[130px] rounded-full px-5 py-2 text-center text-xs font-bold text-white shadow-md ${
                      product.stock_quantity <= 10
                        ? "bg-[#F78D41]"
                        : "bg-[#4AAA5A]"
                    }`}
                  >
                    {product.stock_quantity <= 10 ? "Low Stock" : "In Stock"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="h-[650px] w-[760px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between px-8 pt-5">
              <h2 className="text-3xl font-black">Stock History</h2>

              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="text-2xl leading-none text-black transition hover:scale-110"
              >
                ×
              </button>
            </div>

            <div className="h-[590px] overflow-y-auto px-9 py-5">
              {stockMovements.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No stock history found.
                </div>
              ) : (
                <div className="space-y-3">
                  {stockMovements.map((movement) => (
                    <div
                      key={movement.movement_id}
                      className="grid grid-cols-[170px_1fr_170px] items-center border border-black px-5 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3 font-bold">
                        {movement.movement_type === "restock" && (
                          <>
                            <span className="text-lg">🟢</span>
                            <span>Restock</span>
                          </>
                        )}

                        {movement.movement_type === "sale" && (
                          <>
                            <span className="text-lg">🔴</span>
                            <span>Sale</span>
                          </>
                        )}

                        {movement.movement_type === "initial_stock" && (
                          <>
                            <span className="text-lg">🔵</span>
                            <span>Initial Stock</span>
                          </>
                        )}

                        {movement.movement_type === "adjustment" && (
                          <>
                            <span className="text-lg">🟡</span>
                            <span>Adjustment</span>
                          </>
                        )}
                      </div>

                      <p className="font-bold">
                        {formatMovementText(movement)}
                      </p>

                      <p className="text-right">
                        {formatDateTime(movement.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
