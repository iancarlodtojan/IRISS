import { useMemo, useState } from "react";
import PaymentActionModal from "./PaymentActionModal";
import logoImage from "../../assets/images/ERLogo.jpg.jpg";

export default function InvoiceDetailsModal({ open, onClose, invoice }) {
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);

  const customer = invoice?.customers;
  const payment = invoice?.payments?.[0];

  const logoSrc = logoImage;
  const storeName = "E & R Computer Parts and Accessories Trading";
  const storeAddress =
    "2nd Floor RPlace Building, Barangay 17-B, Davao City, 8000 Davao del Sur, Philippines";
  const storeContact = "0970 886 3668";

  const total = Number(invoice?.total_amount || 0);
  const paid = Number(payment?.amount_paid || total);
  const change = Math.max(paid - total, 0);

  const groupedItems = useMemo(() => {
    const items = invoice?.order_items || [];

    return Object.values(
      items.reduce((groups, item) => {
        const productId =
          item.product_id ||
          item.products?.product_name ||
          item.product_name ||
          item.order_item_id;

        if (!groups[productId]) {
          groups[productId] = {
            product_id: productId,
            product_name: item.products?.product_name || "Unknown Product",
            quantity: 0,
            unit_price: Number(item.unit_price || 0),
            subtotal: 0,
            serials: [],
          };
        }

        groups[productId].quantity += Number(item.quantity || 0);
        groups[productId].subtotal += Number(item.subtotal || 0);

        if (item.serial_number) {
          groups[productId].serials.push(item.serial_number);
        }

        return groups;
      }, {}),
    );
  }, [invoice?.order_items]);

  if (!open || !invoice) return null;

  function generateReceiptHTML() {
    const itemRows = groupedItems
      .map(
        (item) => `
          <tr>
            <td>
              <strong>${item.product_name}</strong>
              ${item.serials
                .map((serial) => `<br /><small>SN: ${serial}</small>`)
                .join("")}
            </td>
            <td class="center">${item.quantity}</td>
            <td class="right">${item.unit_price.toFixed(2)}</td>
            <td class="right">${item.subtotal.toFixed(2)}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <html>
        <head>
          <title>${invoice.invoice_number}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: "Courier New", monospace;
              padding: 12px;
              color: #000;
            }
            .receipt {
              width: 320px;
              margin: auto;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
              margin-bottom: 6px;
            }
            .store {
              font-size: 14px;
              font-weight: bold;
              line-height: 1.3;
            }
            .details {
              font-size: 10px;
              line-height: 1.4;
              margin-top: 4px;
            }
            .line {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .meta {
              font-size: 11px;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th {
              border-bottom: 1px dashed #000;
              padding: 4px 0;
              font-size: 11px;
            }
            td {
              padding: 6px 0;
              vertical-align: top;
            }
            small {
              font-size: 9px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin: 4px 0;
            }
            .grand-total {
              font-size: 16px;
              font-weight: bold;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 8px 0;
              margin: 8px 0;
            }
            .footer {
              font-size: 11px;
              line-height: 1.5;
              margin-top: 12px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <div class="center">
              <img src="${logoSrc}" class="logo" />
              <div class="store">${storeName}</div>
              <div class="details">
                ${storeAddress}<br />
                Contact: ${storeContact}
              </div>
            </div>

            <div class="line"></div>

            <div class="meta">
              Invoice No: ${invoice.invoice_number}<br />
              Date: ${new Date(invoice.created_at).toLocaleString("en-PH")}<br />
              Customer: ${customer?.customer_name || "Walk-in Customer"}<br />
              Payment: ${payment?.payment_method || "Cash"}<br />
              Status: ${payment?.payment_status || "Paid"}
            </div>

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

            <div class="summary-row grand-total">
              <span>TOTAL</span>
              <span>₱${total.toFixed(2)}</span>
            </div>

            <div class="summary-row">
              <span>Paid</span>
              <span>₱${paid.toFixed(2)}</span>
            </div>

            <div class="summary-row">
              <span>Change</span>
              <span>₱${change.toFixed(2)}</span>
            </div>

            <div class="line"></div>

            <div class="footer center">
              Thank you for shopping!<br />
              Please keep this receipt for warranty and reference.
            </div>
          </div>

          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
  }

  function generateInvoiceHTML() {
    const itemRows = groupedItems
      .map(
        (item) => `
          <tr>
            <td>
              <strong>${item.product_name}</strong>
              ${item.serials
                .map((serial) => `<br /><small>SN: ${serial}</small>`)
                .join("")}
            </td>
            <td class="center">${item.quantity}</td>
            <td class="right">₱${item.unit_price.toFixed(2)}</td>
            <td class="right">₱${item.subtotal.toFixed(2)}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <html>
        <head>
          <title>${invoice.invoice_number}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #111;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #111;
              padding-bottom: 22px;
              margin-bottom: 28px;
            }
            .brand {
              display: flex;
              gap: 16px;
              align-items: flex-start;
              max-width: 620px;
            }
            .logo {
              width: 90px;
              height: 90px;
              object-fit: contain;
            }
            .store {
              font-size: 22px;
              font-weight: 800;
              line-height: 1.2;
            }
            .store-info {
              margin-top: 8px;
              font-size: 12px;
              line-height: 1.5;
              color: #333;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h1 {
              margin: 0;
              font-size: 38px;
              letter-spacing: 2px;
            }
            .invoice-title p {
              margin: 8px 0 0;
              font-size: 13px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 26px;
            }
            .box {
              border: 1px solid #222;
              padding: 14px;
              min-height: 110px;
            }
            .box-title {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              margin-bottom: 10px;
              color: #333;
            }
            .box p {
              margin: 4px 0;
              font-size: 14px;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th {
              background: #111;
              color: #fff;
              padding: 12px;
              font-size: 13px;
              text-align: left;
            }
            td {
              border: 1px solid #222;
              padding: 12px;
              font-size: 13px;
              vertical-align: top;
            }
            small {
              font-size: 11px;
              color: #444;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .summary {
              margin-top: 24px;
              margin-left: auto;
              width: 320px;
              border: 1px solid #222;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 14px;
              border-bottom: 1px solid #222;
              font-size: 14px;
            }
            .summary-row:last-child {
              border-bottom: none;
            }
            .summary-row.total {
              background: #f2f2f2;
              font-size: 20px;
              font-weight: 800;
            }
            .footer {
              margin-top: 70px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              font-size: 13px;
            }
            .signature {
              border-top: 1px solid #222;
              padding-top: 8px;
              text-align: center;
            }
            @media print {
              body { padding: 28px; }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="brand">
              <img src="${logoSrc}" class="logo" />

              <div>
                <div class="store">${storeName}</div>
                <div class="store-info">
                  ${storeAddress}<br />
                  Contact: ${storeContact}
                </div>
              </div>
            </div>

            <div class="invoice-title">
              <h1>INVOICE</h1>
              <p><strong>${invoice.invoice_number}</strong></p>
            </div>
          </div>

          <div class="info-grid">
            <div class="box">
              <div class="box-title">Bill To</div>
              <p><strong>${customer?.customer_name || "Walk-in Customer"}</strong></p>
              <p>${customer?.contact_number || "N/A"}</p>
              <p>${customer?.email || ""}</p>
            </div>

            <div class="box">
              <div class="box-title">Invoice Details</div>
              <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString("en-PH")}</p>
              <p><strong>Payment:</strong> ${payment?.payment_method || "Cash"}</p>
              <p><strong>Status:</strong> ${payment?.payment_status || "Paid"}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="center">Qty</th>
                <th class="right">Unit Price</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>

            <tbody>${itemRows}</tbody>
          </table>

          <div class="summary">
            <div class="summary-row total">
              <span>Total</span>
              <span>₱${total.toFixed(2)}</span>
            </div>

            <div class="summary-row">
              <span>Paid</span>
              <span>₱${paid.toFixed(2)}</span>
            </div>

            <div class="summary-row">
              <span>Change</span>
              <span>₱${change.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <div>
              This document serves as the official invoice for this transaction.
            </div>

            <div class="signature">
              Authorized Signature
            </div>
          </div>

          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
  }

  function openPrintWindow(html, width = 900, height = 700) {
    const printWindow = window.open(
      "",
      "_blank",
      `width=${width},height=${height}`,
    );

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
                {groupedItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="border-b border-dashed border-gray-500 py-2"
                  >
                    <div className="flex justify-between gap-3 text-sm font-bold">
                      <div>
                        <p>
                          {item.product_name} ({item.quantity})
                        </p>

                        <div className="mt-1 space-y-1">
                          {item.serials.map((serial) => (
                            <p
                              key={serial}
                              className="text-xs font-normal text-gray-500"
                            >
                              SN: {serial}
                            </p>
                          ))}
                        </div>
                      </div>

                      <p>{item.subtotal.toFixed(2)}</p>
                    </div>

                    <p className="text-sm">
                      {item.quantity} x {item.unit_price.toFixed(2)}
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
                    <p className="text-2xl font-semibold">
                      {change.toFixed(2)}
                    </p>
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