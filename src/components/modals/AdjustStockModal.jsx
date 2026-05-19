import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdjustStockModal({
  open,
  onClose,
  product,
}) {
  const [newStock, setNewStock] = useState(
    String(product?.stock_quantity || 0),
  );

  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open || !product) return null;

  const previousStock = Number(
    product.stock_quantity || 0,
  );

  const adjustedStock = Number(newStock || 0);

  const difference = adjustedStock - previousStock;

  const reasonOptions = [
    "Damaged items",
    "Physical count correction",
    "Missing stock",
    "Wrong encoding",
  ];

  async function handleSave() {
    try {
      setSaving(true);

      if (adjustedStock < 0) {
        alert("Stock cannot be negative");
        return;
      }

      if (adjustedStock === previousStock) {
        alert("No stock changes made");
        return;
      }

      if (!reason.trim()) {
        alert("Please enter an adjustment reason");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const { error: productError } = await supabase
        .from("products")
        .update({
          stock_quantity: adjustedStock,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", product.product_id);

      if (productError) throw productError;

      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          product_id: product.product_id,
          user_id: user.id,
          movement_type: "adjustment",
          quantity: Math.abs(difference),
          previous_stock: previousStock,
          new_stock: adjustedStock,
          reason: reason.trim(),
        });

      if (movementError) throw movementError;

      alert("Stock adjusted successfully");

      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[520px] rounded-3xl bg-white p-6 shadow-2xl">
        {/* HEADER */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black">
              Adjust Stock
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Correct stock quantity and record the
              reason.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none transition hover:scale-110"
          >
            ×
          </button>
        </div>

        {/* PRODUCT */}
        <div className="mb-4 rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Product
          </p>

          <p className="mt-1 text-xl font-black">
            {product.product_name}
          </p>
        </div>

        {/* STOCK CARDS */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {/* CURRENT */}
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">
              Current
            </p>

            <p className="mt-1 text-2xl font-black">
              {previousStock}
            </p>
          </div>

          {/* NEW */}
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">
              New
            </p>

            <p className="mt-1 text-2xl font-black">
              {adjustedStock}
            </p>
          </div>

          {/* DIFFERENCE */}
          <div
            className={`rounded-xl border p-3 ${
              difference < 0
                ? "border-red-200 bg-red-50"
                : difference > 0
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
            }`}
          >
            <p className="text-xs text-gray-500">
              Difference
            </p>

            <p
              className={`mt-1 text-2xl font-black ${
                difference < 0
                  ? "text-red-500"
                  : difference > 0
                    ? "text-green-600"
                    : "text-black"
              }`}
            >
              {difference > 0
                ? `+${difference}`
                : difference}
            </p>
          </div>
        </div>

        {/* INPUT */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold">
            New Stock Quantity
          </label>

          <input
            type="number"
            min="0"
            value={newStock}
            onChange={(e) =>
              setNewStock(e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-[#3693a8]"
          />
        </div>

        {/* QUICK REASONS */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold">
            Quick Reasons
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            {reasonOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setReason(option)}
                className={`rounded-xl border px-3 py-1.5 text-left text-xs transition hover:bg-gray-50 ${
                  reason === option
                    ? "border-[#3693a8] bg-[#3693a8]/10 text-[#3693a8]"
                    : "border-gray-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* REASON */}
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Adjustment Reason
          </label>

          <textarea
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            placeholder="Enter reason for this stock adjustment..."
            className="min-h-[70px] w-full resize-none rounded-xl border border-gray-300 p-4 outline-none focus:border-[#3693a8]"
          />
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl bg-gray-200 px-6 py-2 text-sm font-semibold transition hover:scale-105 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#3693a8] px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}

