import { useEffect, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { cashierLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";

export default function ItemsPage() {
  const [products, setProducts] = useState([]);

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

    loadProducts();

    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppLayout links={cashierLinks}>
      <div className="mb-6">
        <h1 className="text-4xl font-black">INVENTORY</h1>
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
    </AppLayout>
  );
}