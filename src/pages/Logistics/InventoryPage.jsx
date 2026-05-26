import { useEffect, useMemo, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { logisticsLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";
import EditProductModal from "../../components/modals/EditProductModal";
import AdjustStockModal from "../../components/modals/AdjustStockModal";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryGroup, setSelectedHistoryGroup] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    loadOrderItems();
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
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          await loadProducts();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          await loadOrderItems();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_movements",
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          await loadStockHistoryRealtime();
        },
      )
      .subscribe();

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

  function handleEditProduct(product) {
    setSelectedProduct(product);
    setEditOpen(true);
  }

  function handleCloseEdit() {
    setEditOpen(false);
    setSelectedProduct(null);
  }

  function handleAdjustProduct(product) {
    setSelectedProduct(product);
    setAdjustOpen(true);
  }

  function handleCloseAdjust() {
    setAdjustOpen(false);
    setSelectedProduct(null);
  }

  function formatDateTime(dateValue) {
    return new Date(dateValue).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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

    if (group.movement_type === "sale") {
      return `${roleName} sold ${itemText}.`;
    }

    if (group.movement_type === "restock") {
      return `${roleName} restocked ${itemText}.`;
    }

    if (group.movement_type === "initial_stock") {
      return `${roleName} added ${itemText}.`;
    }

    if (group.movement_type === "adjustment") {
      return `${roleName} adjusted ${itemText}.`;
    }

    return `${roleName} updated ${itemText}.`;
  }

  function getQuantitySign(type) {
    if (type === "sale") return "-";
    if (type === "restock") return "+";
    if (type === "initial_stock") return "+";

    return "";
  }

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) => {
      const name = product.product_name?.toLowerCase() || "";

      const status =
        product.status === "inactive"
          ? "inactive"
          : product.stock_quantity === 0
            ? "out of stock"
            : product.stock_quantity <= Number(product.reorder_level || 10)
              ? "low stock"
              : "in stock";

      return name.includes(term) || status.includes(term);
    });
  }, [products, searchTerm]);

  return (
    <AppLayout links={logisticsLinks} onSearch={setSearchTerm}>
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
        <div className="grid grid-cols-[1.4fr_120px_140px_140px_160px_170px] border-b border-gray-300 pb-5 text-sm font-semibold">
          <p>Product</p>
          <p className="text-center">Price</p>
          <p className="text-center">Stock</p>
          <p className="text-center">Sold</p>
          <p className="text-center">Status</p>
          <p className="text-center">Actions</p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredProducts.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center text-gray-400">
              No products found.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.product_id}
                className="grid grid-cols-[1.4fr_140px_120px_140px_160px_170px] items-center py-5 text-sm"
              >
                <p>{product.product_name}</p>

                <p className="text-center font-semibold">
                  ₱{Number(product.selling_price).toFixed(2)}
                </p>

                <p className="text-center">{product.stock_quantity}</p>

                <p className="text-center font-semibold text-red-500">
                  {quantitySoldMap[product.product_id] || 0}
                </p>

                <div className="flex justify-center">
                  <span
                    className={`inline-block min-w-[130px] rounded-full px-5 py-2 text-center text-xs font-bold text-white shadow-md ${
                      product.status === "inactive"
                        ? "bg-gray-400"
                        : product.stock_quantity === 0
                          ? "bg-red-500"
                          : product.stock_quantity <=
                              Number(product.reorder_level || 10)
                            ? "bg-[#F78D41]"
                            : "bg-[#4AAA5A]"
                    }`}
                  >
                    {product.status === "inactive"
                      ? "Inactive"
                      : product.stock_quantity === 0
                        ? "Out of Stock"
                        : product.stock_quantity <=
                            Number(product.reorder_level || 10)
                          ? "Low Stock"
                          : "In Stock"}
                  </span>
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditProduct(product)}
                    className="rounded-lg bg-[#3693a8] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustProduct(product)}
                    className="rounded-lg bg-[#7C6FF0] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

      {editOpen && selectedProduct && (
        <EditProductModal
          key={selectedProduct.product_id}
          open={editOpen}
          product={selectedProduct}
          onClose={handleCloseEdit}
        />
      )}

      {adjustOpen && selectedProduct && (
        <AdjustStockModal
          key={selectedProduct.product_id}
          open={adjustOpen}
          product={selectedProduct}
          onClose={handleCloseAdjust}
        />
      )}
    </AppLayout>
  );
}
