import { useEffect, useMemo, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { cashierLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";

export default function ItemsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const [viewMode, setViewMode] = useState("items");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryGroup, setSelectedHistoryGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

      if (!ignore) setProducts(data || []);
    }

    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("category_id, category_name")
        .order("category_name", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) setCategories(data || []);
    }

    async function loadOrderItems() {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, quantity");

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) setOrderItems(data || []);
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
          reason,
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

      if (!ignore) setStockMovements(data || []);
    }

    loadProducts();
    loadCategories();
    loadOrderItems();
    loadStockHistoryRealtime();

    const channel = supabase
      .channel(`cashier-items-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("ITEMS PRODUCT UPDATE:", payload);
          loadProducts();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        (payload) => {
          console.log("ITEMS CATEGORY UPDATE:", payload);
          loadCategories();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        (payload) => {
          console.log("ITEMS ORDER ITEMS UPDATE:", payload);
          loadOrderItems();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_movements" },
        (payload) => {
          console.log("ITEMS STOCK MOVEMENT UPDATE:", payload);
          loadStockHistoryRealtime();
        },
      )
      .subscribe((status) => {
        console.log("Items realtime status:", status);
      });

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const quantitySoldMap = useMemo(() => {
    const map = {};

    orderItems.forEach((item) => {
      const productId = item.product_id;

      if (!map[productId]) map[productId] = 0;

      map[productId] += Number(item.quantity || 0);
    });

    return map;
  }, [orderItems]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) => {
      const name = product.product_name?.toLowerCase() || "";
      const price = String(product.selling_price || "");

      const status =
        product.status === "inactive"
          ? "inactive"
          : product.stock_quantity === 0
            ? "out of stock"
            : product.stock_quantity <= Number(product.reorder_level || 10)
              ? "low stock"
              : "in stock";

      return (
        name.includes(term) || price.includes(term) || status.includes(term)
      );
    });
  }, [products, searchTerm]);

  const groupedProductsByCategory = useMemo(() => {
    const groups = categories.map((category) => ({
      ...category,
      items: filteredProducts.filter(
        (product) => product.category_id === category.category_id,
      ),
    }));

    const uncategorized = filteredProducts.filter(
      (product) => !product.category_id,
    );

    if (uncategorized.length > 0) {
      groups.push({
        category_id: "uncategorized",
        category_name: "Uncategorized",
        items: uncategorized,
      });
    }

    return groups.filter((group) => group.items.length > 0);
  }, [categories, filteredProducts]);

  const groupedStockHistory = useMemo(() => {
    const groups = {};

    stockMovements.forEach((movement) => {
      const date = new Date(movement.created_at);
      const minuteKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
      const userName =
        movement.users?.full_name || movement.users?.role || "User";
      const key = `${movement.movement_type}-${userName}-${minuteKey}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          movement_type: movement.movement_type,
          userName,
          created_at: movement.created_at,
          items: [],
        };
      }

      groups[key].items.push(movement);
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [stockMovements]);

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
        reason,
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

  function getMovementDisplay(type) {
    if (type === "restock") return { icon: "🟢", label: "Restock" };
    if (type === "sale") return { icon: "🔴", label: "Sale" };
    if (type === "initial_stock") return { icon: "🔵", label: "Added Product" };
    if (type === "adjustment") return { icon: "🟡", label: "Adjustment" };

    return { icon: "⚪", label: "Update" };
  }

  function formatRole(role) {
    if (role === "logistics") return "Logistic";
    if (role === "cashier") return "Cashier";
    if (role === "admin") return "Admin";

    return "User";
  }

  function formatGroupText(group) {
    const itemCount = group.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    const itemText = `${itemCount} item${itemCount > 1 ? "s" : ""}`;
    const role = group.items[0]?.users?.role || "user";
    const roleName = formatRole(role);

    if (group.movement_type === "sale") return `${roleName} sold ${itemText}.`;
    if (group.movement_type === "restock")
      return `${roleName} restocked ${itemText}.`;
    if (group.movement_type === "initial_stock")
      return `${roleName} added ${itemText}.`;
    if (group.movement_type === "adjustment")
      return `${roleName} adjusted ${itemText}.`;

    return `${roleName} updated ${itemText}.`;
  }

  function getQuantitySign(type) {
    if (type === "sale") return "-";
    if (type === "restock") return "+";
    if (type === "initial_stock") return "+";

    return "";
  }

  function getStatusLabel(product) {
    if (product.status === "inactive") return "Inactive";
    if (product.stock_quantity === 0) return "Out of Stock";
    if (product.stock_quantity <= Number(product.reorder_level || 10)) {
      return "Low Stock";
    }

    return "In Stock";
  }

  function getStatusClass(product) {
    if (product.status === "inactive") return "bg-gray-400";
    if (product.stock_quantity === 0) return "bg-red-500";
    if (product.stock_quantity <= Number(product.reorder_level || 10)) {
      return "bg-[#F78D41]";
    }

    return "bg-[#4AAA5A]";
  }

  return (
    <AppLayout links={cashierLinks} onSearch={setSearchTerm}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">INVENTORY</h1>

          <div className="mt-5 flex w-fit overflow-hidden rounded-xl border border-[#3693a8] bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("items")}
              className={`px-7 py-2 text-sm font-semibold transition ${
                viewMode === "items"
                  ? "bg-[#3693a8] text-white"
                  : "text-black hover:bg-[#d9eff1]"
              }`}
            >
              Items
            </button>

            <button
              type="button"
              onClick={() => setViewMode("categories")}
              className={`px-7 py-2 text-sm font-semibold transition ${
                viewMode === "categories"
                  ? "bg-[#3693a8] text-white"
                  : "text-black hover:bg-[#d9eff1]"
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={loadStockHistory}
          className="rounded-xl bg-[#3693a8] px-5 py-2 text-sm text-white shadow-md transition hover:scale-105"
        >
          Stock History
        </button>
      </div>

      {viewMode === "items" ? (
        <div className="rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
          <div className="grid grid-cols-[1.8fr_160px_180px_180px_180px] border-b border-gray-300 pb-5 text-sm font-semibold">
            <p>Product Name</p>
            <p className="text-center">Selling Price</p>
            <p className="text-center">Quantity Sold</p>
            <p className="text-center">Quantity on Hand</p>
            <p className="text-center">Status</p>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <div className="flex h-[420px] items-center justify-center text-gray-400">
                No products found.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const quantitySold = quantitySoldMap[product.product_id] || 0;

                return (
                  <div
                    key={product.product_id}
                    className="grid grid-cols-[1.8fr_160px_180px_180px_180px] items-center py-5 text-sm"
                  >
                    <p>{product.product_name}</p>

                    <p className="text-center font-semibold">
                      ₱{Number(product.selling_price || 0).toFixed(2)}
                    </p>

                    <p className="text-center font-semibold text-red-500">
                      {quantitySold}
                    </p>

                    <p className="text-center font-semibold">
                      {product.stock_quantity}
                    </p>

                    <div className="flex justify-center">
                      <span
                        className={`inline-block min-w-[130px] rounded-full px-5 py-2 text-center text-xs font-bold text-white shadow-md ${getStatusClass(
                          product,
                        )}`}
                      >
                        {getStatusLabel(product)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#f4f4f4] p-6 shadow-md">
          {groupedProductsByCategory.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center text-gray-400">
              No categorized products found.
            </div>
          ) : (
            <div className="space-y-6">
              {groupedProductsByCategory.map((category) => (
                <div key={category.category_id}>
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-[#3693a8] px-5 py-3 text-white shadow-md">
                    <h2 className="text-xl font-black">
                      {category.category_name}
                    </h2>

                    <p className="text-sm font-semibold">
                      {category.items.length} item
                      {category.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {category.items.map((product) => {
                      const quantitySold =
                        quantitySoldMap[product.product_id] || 0;

                      return (
                        <div
                          key={product.product_id}
                          className="grid grid-cols-[1.7fr_150px_150px_150px_150px] items-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm shadow-sm"
                        >
                          <p>{product.product_name}</p>

                          <p className="text-center font-semibold">
                            ₱{Number(product.selling_price || 0).toFixed(2)}
                          </p>

                          <p className="text-center font-semibold text-red-500">
                            Sold: {quantitySold}
                          </p>

                          <p className="text-center font-semibold">
                            Stock: {product.stock_quantity}
                          </p>

                          <div className="flex justify-end">
                            <span
                              className={`rounded-full px-4 py-1 text-xs font-bold text-white ${getStatusClass(
                                product,
                              )}`}
                            >
                              {getStatusLabel(product)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="h-[650px] w-[820px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between px-8 pt-5">
              <h2 className="text-3xl font-black">Stock History</h2>

              <button
                type="button"
                onClick={() => {
                  setHistoryOpen(false);
                  setSelectedHistoryGroup(null);
                }}
                className="text-2xl leading-none text-black transition hover:scale-110"
              >
                ×
              </button>
            </div>

            <div className="h-[590px] overflow-y-auto px-9 py-5">
              {selectedHistoryGroup ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryGroup(null)}
                    className="mb-5 text-xl transition hover:scale-110"
                  >
                    ←
                  </button>

                  <div className="mb-5">
                    <h3 className="text-2xl font-black">
                      {
                        getMovementDisplay(selectedHistoryGroup.movement_type)
                          .label
                      }{" "}
                      Details
                    </h3>

                    <p className="text-sm text-gray-500">
                      {formatDateTime(selectedHistoryGroup.created_at)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {Object.values(
                      [...selectedHistoryGroup.items]
                        .sort(
                          (a, b) =>
                            new Date(a.created_at) - new Date(b.created_at),
                        )
                        .reduce((groups, item) => {
                          const productName =
                            item.products?.product_name || "Unknown Product";

                          const key = `${productName}-${item.reason || ""}-${item.movement_type}`;

                          if (!groups[key]) {
                            groups[key] = {
                              ...item,
                              productName,
                              quantity: 0,
                              previous_stock: item.previous_stock,
                              new_stock: item.new_stock,
                            };
                          }

                          groups[key].quantity += Number(item.quantity || 0);

                          groups[key].new_stock = item.new_stock;

                          return groups;
                        }, {}),
                    ).map((item, index) => (
                      <div
                        key={`${item.productName}-${index}`}
                        className="grid grid-cols-[50px_1fr_120px] items-center border border-black px-5 py-4 text-sm"
                      >
                        <p>{index + 1}</p>

                        <div>
                          <p className="font-medium">{item.productName}</p>

                          {item.reason && (
                            <p className="mt-1 text-xs italic text-gray-400">
                              {item.reason}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-black">
                            {getQuantitySign(item.movement_type)}
                            {item.quantity}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.previous_stock} → {item.new_stock}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : groupedStockHistory.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No stock history found.
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedStockHistory.map((group) => {
                    const movement = getMovementDisplay(group.movement_type);

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedHistoryGroup(group)}
                        className="grid w-full grid-cols-[170px_1fr_190px] items-center border border-black px-5 py-3 text-left text-sm transition hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 font-bold">
                          <span className="text-lg">{movement.icon}</span>
                          <span>{movement.label}</span>
                        </div>

                        <p className="font-bold">{formatGroupText(group)}</p>

                        <p className="text-right">
                          {formatDateTime(group.created_at)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
