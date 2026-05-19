import { useState } from "react";
import PaymentActionModal from "./PaymentActionModal";

export default function InvoiceDetailsModal({ open, onClose, invoice }) {
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);

  if (!open || !invoice) return null;

  const customer = invoice.customers;
  const payment = invoice.payments?.[0];

  const items = invoice.order_items || [];
  const total = Number(invoice.total_amount || 0);
  const paid = Number(payment?.amount_paid || total);
  const change = Math.max(paid - total, 0);

  function generateReceiptHTML() {
    const itemRows = items
      .map(
        (item) => `
          <tr>
            <td>${item.products?.product_name || "Unknown Product"}</td>
            <td class="center">${item.quantity}</td>
            <td class="right">${Number(item.unit_price).toFixed(2)}</td>
            <td class="right">${Number(item.subtotal).toFixed(2)}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <html>
        <head>
          <title>${invoice.invoice_number}</title>
          <style>
            body { font-family: "Courier New", monospace; padding: 20px; }
            .receipt { width: 320px; margin: auto; }
            .center { text-align: center; }
            .right { text-align: right; }
            .title { text-align: center; font-weight: bold; font-size: 16px; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 5px 0; }
            .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="title">E & R Computer Parts and Accessories Trading</div>
            <div class="line"></div>

            Invoice No: ${invoice.invoice_number}<br />
            Date: ${new Date(invoice.created_at).toLocaleString("en-PH")}<br />
            Customer: ${customer?.customer_name || "Walk-in Customer"}<br />
            Payment: ${payment?.payment_method || "Cash"}<br />

            <div class="line"></div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="center">Qty</th>
                  <th class="right">Price</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div class="line"></div>

            <div class="total">
              <span>TOTAL</span>
              <span>₱${total.toFixed(2)}</span>
            </div>

            <p>Paid: ₱${paid.toFixed(2)}</p>
            <p>Change: ₱${change.toFixed(2)}</p>

            <div class="line"></div>
            <p class="center">Thank you!</p>
          </div>

          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
  }

  function generateInvoiceHTML() {
    const itemRows = items
      .map(
        (item) => `
          <tr>
            <td>${item.products?.product_name || "Unknown Product"}</td>
            <td>${item.quantity}</td>
            <td>₱${Number(item.unit_price).toFixed(2)}</td>
            <td>₱${Number(item.subtotal).toFixed(2)}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <html>
        <head>
          <title>${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .store { font-size: 24px; font-weight: bold; }
            .title { font-size: 32px; font-weight: bold; }
            .info { margin-bottom: 24px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 12px; text-align: left; }
            th { background: #f2f2f2; }
            .right { text-align: right; }
            .total { margin-top: 25px; text-align: right; font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="store">E & R Computer Parts and Accessories Trading</div>
              <p>Sales & Inventory System</p>
            </div>
            <div class="title">INVOICE</div>
          </div>

          <div class="info">
            <strong>Invoice No:</strong> ${invoice.invoice_number}<br />
            <strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString("en-PH")}<br />
            <strong>Payment:</strong> ${payment?.payment_method || "Cash"}<br />
            <strong>Status:</strong> ${payment?.payment_status || "Paid"}
          </div>

          <div class="info">
            <strong>Bill To:</strong><br />
            ${customer?.customer_name || "Walk-in Customer"}<br />
            ${customer?.contact_number || "N/A"}<br />
            ${customer?.email || ""}
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div class="total">TOTAL: ₱${total.toFixed(2)}</div>

          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
  }

  function openPrintWindow(html, width = 900, height = 700) {
    const printWindow = window.open("", "_blank", `width=${width},height=${height}`);

    if (!printWindow) {
      alert("Please allow popups");
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="relative w-[760px] rounded-xl bg-white p-5 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-4 text-2xl leading-none transition hover:scale-110"
          >
            ×
          </button>

          <div className="mb-5 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p>
                <span className="font-black">Customer Name:</span>{" "}
                {customer?.customer_name || "Walk-in Customer"}
              </p>

              <p className="mt-2">
                <span className="font-black">Date:</span>{" "}
                {new Date(invoice.created_at).toLocaleDateString("en-PH")}
              </p>
            </div>

            <div>
              <p>
                <span className="font-black">Invoice No.:</span>{" "}
                {invoice.invoice_number}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[280px_1fr] gap-5">
            <div className="flex min-h-[420px] flex-col border border-black bg-white">
              <div className="flex-1 p-4">
                {items.map((item) => (
                  <div
                    key={item.order_item_id}
                    className="border-b border-dashed border-gray-500 py-2"
                  >
                    <div className="flex justify-between text-sm font-bold">
                      <p>{item.products?.product_name || "Unknown Product"}</p>
                      <p>{Number(item.subtotal).toFixed(2)}</p>
                    </div>

                    <p className="text-sm">
                      {item.quantity} x {Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-black p-5 text-2xl font-black">
                <p>TOTAL</p>
                <p>{total.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-black">Payment Method</h3>

              <div className="mb-5 flex h-14 w-[130px] items-center justify-center border border-black">
                {payment?.payment_method || "Cash"}
              </div>

              <h3 className="mb-2 text-lg font-black">Discount</h3>

              <div className="mb-6 h-10 w-full rounded-xl border border-gray-300 px-4" />

              <h3 className="mb-3 text-lg font-black">Payment</h3>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <p>Due:</p>
                  <p className="text-2xl font-semibold">{total.toFixed(2)}</p>
                </div>

                <div className="flex justify-between">
                  <p>Paid:</p>
                  <p className="text-2xl font-semibold">{paid.toFixed(2)}</p>
                </div>

                <div className="border-t border-black pt-4">
                  <div className="flex justify-between">
                    <p>Change:</p>
                    <p className="text-2xl font-semibold">{change.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-28 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPrintOptionsOpen(true)}
                  className="rounded-xl bg-[#cf7f88] px-8 py-2.5 text-sm text-white shadow-md transition hover:scale-105"
                >
                  Print →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentActionModal
        open={printOptionsOpen}
        onClose={() => setPrintOptionsOpen(false)}
        onPrintReceipt={() => openPrintWindow(generateReceiptHTML(), 420, 650)}
        onPrintInvoice={() => openPrintWindow(generateInvoiceHTML(), 900, 700)}
        onSavePDF={() => alert("Save PDF coming soon")}
        onSendEmail={() => alert("Email feature coming soon")}
      />
    </>
  );
}