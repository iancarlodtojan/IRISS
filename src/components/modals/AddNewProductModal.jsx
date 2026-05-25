import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function AddNewProductModal({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);

  const [productName, setProductName] = useState("");
  const [categoryMode, setCategoryMode] = useState("existing");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("category_id, category_name")
        .order("category_name", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setCategories(data || []);
    }

    loadCategories();
  }, [open]);

  async function getOrCreateCategoryId(item) {
    if (item.categoryMode === "existing") {
      return item.category_id || null;
    }

    const name = item.new_category_name.trim();

    if (!name) return null;

    const existing = categories.find(
      (category) =>
        category.category_name.toLowerCase() === name.toLowerCase(),
    );

    if (existing) return existing.category_id;

    const { data, error } = await supabase
      .from("categories")
      .insert({ category_name: name })
      .select("category_id, category_name")
      .single();

    if (error) throw error;

    setCategories((prev) => [...prev, data]);

    return data.category_id;
  }

  function handleAddItem() {
    if (!productName.trim()) {
      alert("Product name is required");
      return;
    }

    if (categoryMode === "existing" && !selectedCategoryId) {
      alert("Please select a category");
      return;
    }

    if (categoryMode === "new" && !newCategoryName.trim()) {
      alert("Please enter a new category name");
      return;
    }

    if (Number(costPrice) < 0 || Number(sellingPrice) < 0) {
      alert("Cost and price cannot be negative");
      return;
    }

    if (Number(quantity) < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    const selectedCategory = categories.find(
      (category) => String(category.category_id) === String(selectedCategoryId),
    );

    setItems((prev) => [
      ...prev,
      {
        product_name: productName.trim(),
        categoryMode,
        category_id:
          categoryMode === "existing" ? Number(selectedCategoryId) : null,
        category_name:
          categoryMode === "existing"
            ? selectedCategory?.category_name || "Uncategorized"
            : newCategoryName.trim(),
        new_category_name:
          categoryMode === "new" ? newCategoryName.trim() : "",
        cost_price: Number(costPrice || 0),
        selling_price: Number(sellingPrice || 0),
        stock_quantity: Number(quantity || 0),
        reorder_level: 10,
      },
    ]);

    resetDetailForm();
    setDetailOpen(false);
  }

  function handleRemoveItem(indexToRemove) {
    setItems((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  async function handleConfirmProducts() {
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

      for (const item of items) {
        const categoryId = await getOrCreateCategoryId(item);

        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            category_id: categoryId,
            product_name: item.product_name,
            cost_price: item.cost_price,
            selling_price: item.selling_price,
            stock_quantity: item.stock_quantity,
            reorder_level: item.reorder_level,
            status: "active",
          })
          .select("product_id")
          .single();

        if (productError) throw productError;

        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert({
            product_id: product.product_id,
            user_id: user.id,
            movement_type: "initial_stock",
            quantity: item.stock_quantity,
            previous_stock: 0,
            new_stock: item.stock_quantity,
          });

        if (movementError) throw movementError;
      }

      alert("New products added successfully");

      resetAll();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  function resetDetailForm() {
    setProductName("");
    setCategoryMode("existing");
    setSelectedCategoryId("");
    setNewCategoryName("");
    setCostPrice("");
    setSellingPrice("");
    setQuantity("");
  }

  function resetAll() {
    setItems([]);
    setDetailOpen(false);
    resetDetailForm();
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative h-[620px] w-[860px] rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-4 text-xl"
        >
          ×
        </button>

        <h2 className="mb-4 text-2xl font-black">New Products</h2>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.product_name}-${index}`}
              className="grid grid-cols-[40px_1.2fr_1fr_110px_110px_90px_40px] items-center border border-gray-500 px-4 py-3 text-sm"
            >
              <p>{index + 1}</p>
              <p>{item.product_name}</p>
              <p>{item.category_name}</p>
              <p className="text-center">{item.cost_price.toFixed(2)}</p>
              <p className="text-center">{item.selling_price.toFixed(2)}</p>
              <p className="text-center">{item.stock_quantity}</p>

              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="text-right"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="flex w-full items-center gap-3 border border-dashed border-gray-400 px-3 py-2 text-sm"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
              <Plus className="h-5 w-5" />
            </span>
            Add Product
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
            onClick={handleConfirmProducts}
            disabled={saving}
            className="rounded-xl bg-[#3693a8] px-7 py-2.5 text-sm text-white shadow-md disabled:opacity-60"
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>

        {detailOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="relative w-[420px] rounded-xl bg-white p-5 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  resetDetailForm();
                  setDetailOpen(false);
                }}
                className="absolute right-3 top-2"
              >
                ×
              </button>

              <h3 className="mb-3 text-lg font-black">Product Details</h3>

              <label className="mb-1 block text-sm font-semibold">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mb-3 h-9 w-full rounded-lg border border-gray-400 px-3 outline-none"
              />

              <label className="mb-1 block text-sm font-semibold">
                Category
              </label>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryMode("existing")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    categoryMode === "existing"
                      ? "bg-[#3693a8] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  Existing
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryMode("new")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    categoryMode === "new"
                      ? "bg-[#3693a8] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  New Category
                </button>
              </div>

              {categoryMode === "existing" ? (
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mb-3 h-9 w-full rounded-lg border border-gray-400 px-3 outline-none"
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter new category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mb-3 h-9 w-full rounded-lg border border-gray-400 px-3 outline-none"
                />
              )}

              <label className="mb-1 block text-sm font-semibold">Cost</label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="mb-3 h-9 w-full rounded-lg border border-gray-400 px-3 outline-none"
              />

              <label className="mb-1 block text-sm font-semibold">Price</label>
              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="mb-3 h-9 w-full rounded-lg border border-gray-400 px-3 outline-none"
              />

              <label className="mb-1 block text-sm font-semibold">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mb-5 h-9 w-full rounded-lg border border-gray-400 px-3 outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="rounded-lg bg-[#3693a8] px-5 py-2 text-xs text-white"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}