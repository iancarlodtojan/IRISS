import { useEffect, useMemo, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { logisticsLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";

export default function PriceListPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("product_id, product_name, cost_price, selling_price")
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
      .channel("cashier-price-list-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        loadProducts,
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      product.product_name?.toLowerCase().includes(term),
    );
  }, [products, searchTerm]);

  return (
    <AppLayout links={logisticsLinks} onSearch={setSearchTerm}>
      <div className="mb-6">
        <h1 className="text-4xl font-black">PRICE LIST</h1>
      </div>

      <div className="min-h-[650px] rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
        {/* HEADER */}
        <div className="grid grid-cols-[1.6fr_200px_180px_200px] border-b border-gray-300 pb-5 text-sm font-semibold">
          <p>Product Name</p>

          <p className="text-center">Supplier Price</p>

          <p className="text-center">Markup</p>

          <p className="text-center">Selling Price</p>
        </div>

        {/* BODY */}
        <div className="divide-y divide-gray-200">
          {filteredProducts.length === 0 ? (
            <div className="flex h-[520px] items-center justify-center text-gray-400">
              No products found.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const supplierPrice = Number(product.cost_price || 0);

              const sellingPrice = Number(product.selling_price || 0);

              const markup = sellingPrice - supplierPrice;

              return (
                <div
                  key={product.product_id}
                  className="grid grid-cols-[1.6fr_200px_180px_200px] items-center py-5 text-sm"
                >
                  {/* PRODUCT NAME */}
                  <p className="font-medium">{product.product_name}</p>

                  {/* SUPPLIER PRICE */}
                  <p className="text-center font-medium text-gray-500">
                    ₱{supplierPrice.toFixed(2)}
                  </p>

                  {/* MARKUP */}
                  <p className="text-center font-semibold text-[#F78D41]">
                    ₱{markup.toFixed(2)}
                  </p>

                  {/* SELLING PRICE */}
                  <p className="text-center font-bold text-[#3693a8]">
                    ₱{sellingPrice.toFixed(2)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
