import { useState } from "react";

import { supabase } from "../../lib/supabaseClient";

export default function EditProductModal({ open, onClose, product }) {
  const [productName, setProductName] = useState(product?.product_name || "");
  const [sellingPrice, setSellingPrice] = useState(
    String(product?.selling_price || "")
  );
  const [costPrice, setCostPrice] = useState(String(product?.cost_price || ""));
  const [reorderLevel, setReorderLevel] = useState(
    String(product?.reorder_level || 10)
  );
  const [status, setStatus] = useState(product?.status || "active");

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);

      if (!productName.trim()) {
        alert("Product name is required");
        return;
      }

      const { error } = await supabase
        .from("products")
        .update({
          product_name: productName.trim(),
          selling_price: Number(sellingPrice || 0),
          cost_price: Number(costPrice || 0),
          reorder_level: Number(reorderLevel || 10),
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", product.product_id);

      if (error) throw error;

      alert("Product updated successfully");

      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[520px] rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-black">Edit Product</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none transition hover:scale-110"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Product Name
            </label>

            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Selling Price
            </label>

            <input
              type="number"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Cost Price
            </label>

            <input
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Reorder Level
            </label>

            <input
              type="number"
              min="1"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Status</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-4 outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-200 px-6 py-2 text-sm font-semibold transition hover:scale-105"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#3693a8] px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}