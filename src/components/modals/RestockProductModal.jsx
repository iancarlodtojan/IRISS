import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function RestockProductModal({ open, onClose }) {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("product_id, product_name, cost_price, stock_quantity")
        .eq("status", "active")
        .order("product_name", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setProducts(data || []);
    }

    loadProducts();
  }, [open]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 6);

    return products
      .filter((product) =>
        product.product_name
          .toLowerCase()
          .includes(productSearch.toLowerCase())
      )
      .slice(0, 6);
  }, [products, productSearch]);

  function handleAddItem() {
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    const itemQuantity = Number(quantity);

    if (itemQuantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const existingItem = items.find(
      (item) => item.product_id === selectedProduct.product_id
    );

    if (existingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.product_id === selectedProduct.product_id
            ? {
                ...item,
                quantity: item.quantity + itemQuantity,
                subtotal:
                  (item.quantity + itemQuantity) * item.cost_price,
              }
            : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          product_id: selectedProduct.product_id,
          product_name: selectedProduct.product_name,
          current_stock: selectedProduct.stock_quantity,
          quantity: itemQuantity,
          cost_price: Number(selectedProduct.cost_price),
          subtotal: itemQuantity * Number(selectedProduct.cost_price),
        },
      ]);
    }

    setPickerOpen(false);
    setProductSearch("");
    setSelectedProduct(null);
    setQuantity("");
  }

  function handleRemoveItem(productId) {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  }

  async function handleConfirmRestock() {
    try {
      if (items.length === 0) {
        alert("Please add at least one product");
        return;
      }

      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);

      const { data: restock, error: restockError } = await supabase
        .from("restocks")
        .insert({
          user_id: user.id,
          total_cost: totalCost,
        })
        .select("restock_id")
        .single();

      if (restockError) throw restockError;

      const restockItemsPayload = items.map((item) => ({
        restock_id: restock.restock_id,
        product_id: item.product_id,
        quantity: item.quantity,
        cost_price: item.cost_price,
        subtotal: item.subtotal,
      }));

      const { error: restockItemsError } = await supabase
        .from("restock_items")
        .insert(restockItemsPayload);

      if (restockItemsError) throw restockItemsError;

      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("product_id", item.product_id)
          .single();

        if (productError) throw productError;

        const newStock = product.stock_quantity + item.quantity;

        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", item.product_id);

        if (stockError) throw stockError;

        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert({
            product_id: item.product_id,
            user_id: user.id,
            movement_type: "restock",
            quantity: item.quantity,
            previous_stock: product.stock_quantity,
            new_stock: newStock,
          });

        if (movementError) throw movementError;
      }

      alert("Products restocked successfully");

      setItems([]);
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setItems([]);
    setPickerOpen(false);
    setProductSearch("");
    setSelectedProduct(null);
    setQuantity("");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative h-[620px] w-[760px] rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-4 text-xl"
        >
          ×
        </button>

        <h2 className="mb-4 text-2xl font-black">Restock Products</h2>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.product_id}
              className="grid grid-cols-[40px_1fr_100px_40px] items-center border border-gray-400 px-4 py-3 text-sm"
            >
              <p>{index + 1}</p>
              <p>{item.product_name}</p>
              <p className="text-center">{item.quantity}</p>

              <button
                type="button"
                onClick={() => handleRemoveItem(item.product_id)}
                className="text-right"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center gap-3 border border-dashed border-gray-400 px-3 py-2 text-sm"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
              <Plus className="h-5 w-5" />
            </span>
            Select Product
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex justify-between">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl bg-[#cf7f88] px-7 py-2.5 text-sm text-white shadow-md disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmRestock}
            disabled={saving}
            className="rounded-xl bg-[#3693a8] px-7 py-2.5 text-sm text-white shadow-md disabled:opacity-60"
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>

        {pickerOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="relative w-[380px] rounded-xl bg-white p-5 shadow-2xl">
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="absolute right-3 top-2"
              >
                ×
              </button>

              <label className="mb-2 block text-sm font-semibold">
                Product Name
              </label>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setSelectedProduct(null);
                  }}
                  className="h-10 w-full rounded-lg border border-gray-400 px-3 outline-none"
                />

                {productSearch && !selectedProduct && (
                  <div className="absolute left-0 top-[44px] z-[130] max-h-[180px] w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.product_id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);
                          setProductSearch(product.product_name);
                        }}
                        className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <span>{product.product_name}</span>
                        <span>Stock: {product.stock_quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="mb-2 block text-sm font-semibold">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mb-5 h-10 w-full rounded-lg border border-gray-400 px-3 outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="rounded-lg bg-[#3693a8] px-5 py-2 text-xs text-white"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}