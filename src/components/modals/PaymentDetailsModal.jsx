import { useMemo, useState } from "react";

export default function PaymentDetailsModal({
  open,
  onClose,
  items,
  total,
  saving,
  onSave,
  onPrint,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const displayPaidAmount =
    paidAmount === "" ? total.toFixed(2) : paidAmount;

  const discountValue = useMemo(() => {
    return Math.max(Number(discount || 0), 0);
  }, [discount]);

  const amountDue = useMemo(() => {
    return Math.max(total - discountValue, 0);
  }, [total, discountValue]);

  const paidValue = useMemo(() => {
    return Math.max(Number(displayPaidAmount || 0), 0);
  }, [displayPaidAmount]);

  const change = useMemo(() => {
    return Math.max(paidValue - amountDue, 0);
  }, [paidValue, amountDue]);

  const canProceed = paidValue >= amountDue;

  function handleSaveClick() {
    if (!canProceed) {
      alert("Paid amount is less than the amount due");
      return;
    }

    onSave({
      paymentMethod,
      discount: discountValue,
      amountDue,
      paidAmount: paidValue,
      change,
    });
  }

  function handlePrintClick() {
    if (!canProceed) {
      alert("Paid amount is less than the amount due");
      return;
    }

    onPrint({
      paymentMethod,
      discount: discountValue,
      amountDue,
      paidAmount: paidValue,
      change,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[860px] rounded-xl bg-white p-6 shadow-2xl">
        <div className="grid grid-cols-[320px_1fr] gap-8">
          {/* LEFT SUMMARY */}
          <div className="flex min-h-[520px] flex-col border border-black bg-white">
            <div className="flex-1 p-4">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="border-b border-dashed border-gray-500 py-2"
                >
                  <div className="flex justify-between text-sm font-bold">
                    <p>{item.product_name}</p>

                    <p>{item.subtotal.toFixed(2)}</p>
                  </div>

                  <p className="text-sm">
                    {item.quantity} x{" "}
                    {item.selling_price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-black p-5">
              {discountValue > 0 && (
                <div className="mb-2 flex justify-between text-sm">
                  <p>DISCOUNT</p>

                  <p>-{discountValue.toFixed(2)}</p>
                </div>
              )}

              <div className="flex justify-between text-2xl font-black">
                <p>TOTAL</p>

                <p>{amountDue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div>
            <h3 className="mb-4 text-lg font-black">
              Payment Method
            </h3>

            <div className="mb-5 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`h-14 border transition ${
                  paymentMethod === "cash"
                    ? "border-black bg-gray-100"
                    : "border-gray-300"
                }`}
              >
                Cash
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`h-14 border transition ${
                  paymentMethod === "card"
                    ? "border-black bg-gray-100"
                    : "border-gray-300"
                }`}
              >
                Card
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("check")}
                className={`h-14 border transition ${
                  paymentMethod === "check"
                    ? "border-black bg-gray-100"
                    : "border-gray-300"
                }`}
              >
                Check
              </button>
            </div>

            {/* DISCOUNT */}
            <h3 className="mb-2 text-lg font-black">
              Discount
            </h3>

            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
              className="mb-6 h-10 w-full rounded-xl border border-gray-300 px-4 outline-none"
            />

            {/* PAYMENT */}
            <h3 className="mb-3 text-lg font-black">
              Payment
            </h3>

            <div className="space-y-5 text-sm">
              <div className="flex items-center justify-between">
                <p>Due:</p>

                <p className="text-2xl font-semibold">
                  {amountDue.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p>Paid:</p>

                <input
                  type="number"
                  min="0"
                  value={displayPaidAmount}
                  onChange={(e) =>
                    setPaidAmount(e.target.value)
                  }
                  className="h-10 w-[180px] rounded-xl border border-gray-300 px-4 text-right text-2xl font-semibold outline-none"
                />
              </div>

              <div className="border-t border-black pt-4">
                <div className="flex justify-between">
                  <p>Change:</p>

                  <p className="text-2xl font-semibold">
                    {change.toFixed(2)}
                  </p>
                </div>
              </div>

              {!canProceed && (
                <p className="text-right text-xs font-semibold text-red-500">
                  Paid amount is less than amount due.
                </p>
              )}
            </div>

            {/* BUTTONS */}
            <div className="mt-32 flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#3693a8] px-5 py-2 text-sm text-white transition hover:scale-105"
              >
                ← Back to Items
              </button>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={saving || !canProceed}
                  className="rounded-xl bg-[#c98fb7] px-8 py-2.5 text-sm text-white transition hover:scale-105 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  type="button"
                  onClick={handlePrintClick}
                  disabled={saving || !canProceed}
                  className="rounded-xl bg-[#cf7f88] px-8 py-2.5 text-sm text-white transition hover:scale-105 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Print →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}