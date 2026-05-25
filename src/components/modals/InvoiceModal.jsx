import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import PaymentDetailsModal from "./PaymentDetailsModal";
import PaymentActionModal from "./PaymentActionModal";
import logoImage from "../../assets/images/ERLogo.jpg.jpg";

export default function InvoiceModal({ open, onClose }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [serialNumber, setSerialNumber] = useState("");

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [paymentActionsOpen, setPaymentActionsOpen] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const serialInputRef = useRef(null);

  const logoSrc = logoImage;
  const storeName = "E & R Computer Parts and Accessories Trading";
  const storeAddress =
    "2nd Floor RPlace Building, Barangay 17-B, Davao City, 8000 Davao del Sur, Philippines";
  const storeContact = "0970 886 3668";

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    async function loadData() {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("product_id, product_name, selling_price, stock_quantity")
        .eq("status", "active")
        .order("product_name", { ascending: true });

      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("customer_id, customer_name, contact_number, email")
        .order("customer_name", { ascending: true });

      if (productsError) {
        console.error(productsError);
        return;
      }

      if (customersError) {
        console.error(customersError);
        return;
      }

      if (!ignore) {
        setProducts(productsData || []);
        setCustomers(customersData || []);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [open]);

  const filteredCustomers = useMemo(() => {
    if (!customerName.trim() || selectedCustomer) return [];

    return customers
      .filter((customer) =>
        customer.customer_name
          .toLowerCase()
          .includes(customerName.toLowerCase()),
      )
      .slice(0, 5);
  }, [customerName, customers, selectedCustomer]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      product.product_name.toLowerCase().includes(term),
    );
  }, [productSearch, products]);

  const totalAmount = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [invoiceItems]);

  function normalizeName(name) {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function makeItemId() {
    if (crypto?.randomUUID) return crypto.randomUUID();

    return `${Date.now()}-${Math.random()}`;
  }

  function handleSelectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerName(customer.customer_name);
    setContactNumber(customer.contact_number || "");
    setEmail(customer.email || "");
  }

  function handleSelectProduct(product) {
    setSelectedProduct(product);
    setSerialNumber("");

    setTimeout(() => {
      serialInputRef.current?.focus();
    }, 0);
  }

  function handleClearSelectedProduct() {
    setSelectedProduct(null);
    setSerialNumber("");
  }

  function handleAddSelectedProduct() {
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    const trimmedSerial = serialNumber.trim();

    if (!trimmedSerial) {
      alert("Serial number is required");
      return;
    }

    const duplicateSerial = invoiceItems.some(
      (item) =>
        item.serial_number.toLowerCase() === trimmedSerial.toLowerCase(),
    );

    if (duplicateSerial) {
      alert("This serial number is already added to the invoice");
      return;
    }

    const existingProductQuantity = invoiceItems
      .filter((item) => item.product_id === selectedProduct.product_id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (existingProductQuantity + 1 > selectedProduct.stock_quantity) {
      alert("Quantity exceeds available stock");
      return;
    }

    setInvoiceItems((prev) => [
      ...prev,
      {
        id: makeItemId(),
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        serial_number: trimmedSerial,
        quantity: 1,
        selling_price: Number(selectedProduct.selling_price),
        subtotal: Number(selectedProduct.selling_price),
      },
    ]);

    setSerialNumber("");

    setTimeout(() => {
      serialInputRef.current?.focus();
    }, 0);
  }

  function handleRemoveItem(itemId) {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  async function getOrCreateCustomer() {
    const trimmedName = customerName.trim();
    const finalName = trimmedName || "Walk-in Customer";

    if (selectedCustomer) {
      return selectedCustomer.customer_id;
    }

    if (trimmedName && !contactNumber.trim()) {
      throw new Error("Contact number is required for new customer");
    }

    const normalizedTypedName = normalizeName(finalName);

    const existingCustomer = customers.find(
      (customer) =>
        normalizeName(customer.customer_name) === normalizedTypedName,
    );

    if (existingCustomer) {
      return existingCustomer.customer_id;
    }

    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        customer_name: finalName,
        contact_number: contactNumber.trim(),
        email: email.trim() || null,
      })
      .select("customer_id")
      .single();

    if (error) throw error;

    return newCustomer.customer_id;
  }

  function generateInvoiceNumber() {
    return `INV-${Date.now()}`;
  }

  async function saveInvoiceToDatabase(paymentData) {
    if (invoiceItems.length === 0) {
      throw new Error("Please add at least one item");
    }

    const customerId = await getOrCreateCustomer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not logged in");
    }

    const invoiceNumber = generateInvoiceNumber();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        user_id: user.id,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
      })
      .select("order_id, invoice_number, created_at")
      .single();

    if (orderError) throw orderError;

    const orderItemsPayload = invoiceItems.map((item) => ({
      order_id: order.order_id,
      product_id: item.product_id,
      serial_number: item.serial_number || null,
      quantity: item.quantity,
      unit_price: item.selling_price,
      subtotal: item.subtotal,
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (orderItemsError) throw orderItemsError;

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.order_id,
      user_id: user.id,
      payment_method: paymentData.paymentMethod,
      amount_paid: paymentData.paidAmount,
      payment_status: "paid",
    });

    if (paymentError) throw paymentError;

    for (const item of invoiceItems) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("product_id", item.product_id)
        .single();

      if (productError) throw productError;

      const newStock = Number(product.stock_quantity) - Number(item.quantity);

      if (newStock < 0) {
        throw new Error(`${item.product_name} has insufficient stock`);
      }

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
          movement_type: "sale",
          quantity: item.quantity,
          previous_stock: product.stock_quantity,
          new_stock: newStock,
        });

      if (movementError) throw movementError;
    }

    return {
      order,
      invoiceNumber,
      customer: {
        name: customerName.trim() || "Walk-in Customer",
        contact: contactNumber.trim() || "N/A",
        email: email.trim() || "",
      },
      payment: {
        method: paymentData.paymentMethod,
        paid: Number(paymentData.paidAmount || 0),
        status: "Paid",
      },
      items: invoiceItems,
      total: totalAmount,
    };
  }
  function groupInvoiceItems(items) {
    return Object.values(
      items.reduce((groups, item) => {
        if (!groups[item.product_id]) {
          groups[item.product_id] = {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: 0,
            selling_price: item.selling_price,
            subtotal: 0,
            serials: [],
          };
        }

        groups[item.product_id].quantity += Number(item.quantity || 0);
        groups[item.product_id].subtotal += Number(item.subtotal || 0);

        if (item.serial_number) {
          groups[item.product_id].serials.push(item.serial_number);
        }

        return groups;
      }, {}),
    );
  }

  function generateReceiptHTML(invoice) {
    const groupedItems = groupInvoiceItems(invoice.items);

    const paid = Number(invoice.payment?.paid || invoice.total);
    const change = Math.max(paid - invoice.total, 0);

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
          <td class="right">${item.selling_price.toFixed(2)}</td>
          <td class="right">${item.subtotal.toFixed(2)}</td>
        </tr>
      `,
      )
      .join("");

    return `
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: "Courier New", monospace;
            padding: 12px;
            color: #000;
          }

          .receipt {
            width: 320px;
            margin: auto;
          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

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
            body {
              padding: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="receipt">
          <div class="center">
            <img src="${logoSrc}" class="logo" />

            <div class="store">
              ${storeName}
            </div>

            <div class="details">
              ${storeAddress}<br />
              Contact: ${storeContact}
            </div>
          </div>

          <div class="line"></div>

<div class="meta">
  Invoice No: ${invoice.invoiceNumber}<br />
  Date: ${new Date(invoice.order.created_at).toLocaleString("en-PH")}<br />
  Customer: ${invoice.customer.name}<br />
  Payment: ${invoice.payment?.method || "Cash"}<br />
  Status: ${invoice.payment?.status || "Paid"}
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

  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="line"></div>

<div class="summary-row grand-total">
  <span>TOTAL</span>
  <span>₱${invoice.total.toFixed(2)}</span>
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

        <script>
          window.onload = () => window.print();
        </script>
      </body>
    </html>
  `;
  }

  function generateInvoiceHTML(invoice) {
    const groupedItems = groupInvoiceItems(invoice.items);

    const paid = Number(invoice.payment?.paid || invoice.total);
    const change = Math.max(paid - invoice.total, 0);

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

          <td class="right">
            ₱${item.selling_price.toFixed(2)}
          </td>

          <td class="right">
            ₱${item.subtotal.toFixed(2)}
          </td>
        </tr>
      `,
      )
      .join("");

    return `
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>

        <style>
          * {
            box-sizing: border-box;
          }

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

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

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
            <p><strong>${invoice.invoiceNumber}</strong></p>
          </div>
        </div>

        <div class="info-grid">
          <div class="box">
            <div class="box-title">Bill To</div>

            <p>
              <strong>${invoice.customer.name}</strong>
            </p>

            <p>${invoice.customer.contact || "N/A"}</p>

            <p>${invoice.customer.email || ""}</p>
          </div>

          <div class="box">
            <div class="box-title">Invoice Details</div>

            <p>
              <strong>Date:</strong>
              ${new Date(invoice.order.created_at).toLocaleString("en-PH")}
            </p>

            <strong>Payment:</strong> ${invoice.payment?.method || "Cash"}

            <p>
              <strong>Status:</strong> Paid
            </p>
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

          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="summary">
  <div class="summary-row total">
    <span>Total</span>
    <span>₱${invoice.total.toFixed(2)}</span>
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

        <script>
          window.onload = () => window.print();
        </script>
      </body>
    </html>
  `;
  }

  function openPrintWindow(invoice, width = 420, height = 650) {
    const receiptHTML = generateReceiptHTML(invoice);

    const printWindow = window.open(
      "",
      "_blank",
      `width=${width},height=${height}`,
    );

    if (!printWindow) {
      alert("Please allow popups");
      return;
    }

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  }

  function handleProceedToPayment() {
    if (invoiceItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setPaymentDetailsOpen(true);
  }

  async function handleSaveInvoice(paymentData) {
    try {
      setSaving(true);

      const invoice = await saveInvoiceToDatabase(paymentData);

      alert(`Invoice saved successfully: ${invoice.invoiceNumber}`);

      resetForm();
      setPaymentDetailsOpen(false);
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePrintInvoice(paymentData) {
    try {
      setSaving(true);

      const invoice = await saveInvoiceToDatabase(paymentData);

      setSavedInvoice(invoice);
      setPaymentDetailsOpen(false);
      setPaymentActionsOpen(true);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setCustomerName("");
    setContactNumber("");
    setEmail("");
    setSelectedCustomer(null);
    setProductSearch("");
    setSelectedProduct(null);
    setSerialNumber("");
    setInvoiceItems([]);
  }

  function handleCancel() {
    resetForm();
    setPaymentDetailsOpen(false);
    setPaymentActionsOpen(false);
    setSavedInvoice(null);
    onClose();
  }

  const groupedInvoiceItems = Object.values(
    invoiceItems.reduce((groups, item) => {
      if (!groups[item.product_id]) {
        groups[item.product_id] = {
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: 0,
          selling_price: item.selling_price,
          subtotal: 0,
          items: [],
        };
      }

      groups[item.product_id].quantity += item.quantity;
      groups[item.product_id].subtotal += item.subtotal;
      groups[item.product_id].items.push(item);

      return groups;
    }, {}),
  );

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="flex h-[88vh] w-[min(1280px,94vw)] flex-col overflow-hidden rounded-3xl bg-[#f4f4f4] p-5 shadow-2xl">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Create Invoice</h2>
              <p className="mt-1 text-xs text-gray-500">
                Select a product, scan or enter the serial number, then press
                Enter to add.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl bg-[#cf7f88] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>

          <div className="mb-3 rounded-2xl border border-gray-300 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold">Customer Name</label>

              {selectedCustomer && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Existing customer selected
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search or enter customer name..."
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setSelectedCustomer(null);
                  setContactNumber("");
                  setEmail("");
                }}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#9ed5d9]"
              />

              {filteredCustomers.length > 0 && (
                <div className="absolute left-0 top-[44px] z-[130] max-h-[170px] w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-xl">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.customer_id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="flex w-full flex-col px-4 py-3 text-left hover:bg-gray-100"
                    >
                      <span className="font-semibold">
                        {customer.customer_name}
                      </span>

                      <span className="text-xs text-gray-500">
                        {customer.contact_number || "No contact number"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="mt-2 grid grid-cols-3 gap-3 rounded-xl border border-green-200 bg-green-50 p-2 text-xs">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-semibold">
                    {selectedCustomer.customer_name}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Contact Number</p>
                  <p className="font-semibold">
                    {selectedCustomer.contact_number || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Email Address</p>
                  <p className="font-semibold">
                    {selectedCustomer.email || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {!selectedCustomer && customerName.trim() && (
              <div className="mt-2 rounded-xl border border-[#3693a8]/20 bg-[#3693a8]/5 p-2">
                <p className="mb-2 text-xs font-semibold text-[#3693a8]">
                  New customer details
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Contact number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="h-9 rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#9ed5d9]"
                  />

                  <input
                    type="email"
                    placeholder="Email optional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#9ed5d9]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[390px_1fr] gap-4">
            <div className="flex min-h-0 flex-col rounded-2xl border border-gray-300 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-black">Products</h3>

                <span className="rounded-full bg-[#d9eff1] px-3 py-1 text-xs font-semibold text-black">
                  {filteredProducts.length} shown
                </span>
              </div>

              {!selectedProduct && (
                <>
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="mb-2 h-10 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#9ed5d9]"
                  />

                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {filteredProducts.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        No products found.
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.product_id}
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left transition hover:scale-[1.01] hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold leading-tight">
                                {product.product_name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Stock: {product.stock_quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-black text-[#3693a8]">
                              ₱{Number(product.selling_price).toFixed(2)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              <div
                className={`${selectedProduct ? "flex-1" : "mt-3 shrink-0"} rounded-2xl border border-[#b7dfe5] bg-[#eef7f8] p-4 shadow-md`}
              >
                {selectedProduct ? (
                  <>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Selected Product
                        </p>

                        <h4 className="mt-1 text-sm font-black leading-tight">
                          {selectedProduct.product_name}
                        </h4>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Qty</p>
                          <p className="text-lg font-black">1</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleClearSelectedProduct}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-gray-500 shadow-sm transition hover:scale-110 hover:text-red-500"
                          title="Clear selected product"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="mb-2 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-xl bg-white p-2">
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="font-black">
                          ₱{Number(selectedProduct.selling_price).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-2">
                        <p className="text-xs text-gray-500">Available</p>
                        <p className="font-black">
                          {selectedProduct.stock_quantity}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-2">
                        <p className="text-xs text-gray-500">Added</p>
                        <p className="font-black">
                          {
                            invoiceItems.filter(
                              (item) =>
                                item.product_id === selectedProduct.product_id,
                            ).length
                          }
                        </p>
                      </div>
                    </div>

                    <label className="mb-1 block text-xs font-semibold">
                      Serial Number
                    </label>

                    <div className="flex gap-2">
                      <input
                        ref={serialInputRef}
                        type="text"
                        placeholder="Enter serial..."
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddSelectedProduct();
                          }
                        }}
                        className="h-10 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#9ed5d9]"
                      />

                      <button
                        type="button"
                        onClick={handleAddSelectedProduct}
                        className="h-10 rounded-xl bg-[#3693a8] px-4 text-sm font-semibold text-white shadow-md transition hover:scale-105"
                      >
                        Add
                      </button>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Quantity is locked to 1 per serial number.
                    </p>
                  </>
                ) : (
                  <div className="py-5 text-center text-sm text-gray-400">
                    Select a product to enter its serial number.
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white">
              <div className="border-b border-gray-300 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Current Invoice</h3>

                  <span className="rounded-full bg-[#d9eff1] px-3 py-1 text-xs font-semibold">
                    {invoiceItems.length} item
                    {invoiceItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[1.7fr_70px_110px_120px_75px] border-b border-gray-200 px-4 py-2 text-sm font-semibold">
                <p>Product</p>
                <p className="text-center">Qty</p>
                <p className="text-center">Price</p>
                <p className="text-right">Amount</p>
                <p></p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
                {invoiceItems.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-gray-400">
                    <div>
                      <p className="font-semibold">No items added yet.</p>
                      <p className="mt-1 text-sm">
                        Select a product on the left to start.
                      </p>
                    </div>
                  </div>
                ) : (
                  groupedInvoiceItems.map((group) => (
                    <div
                      key={group.product_id}
                      className="grid grid-cols-[1.7fr_70px_110px_120px_75px] items-start border-b border-gray-100 py-2 text-sm"
                    >
                      <div>
                        <p className="font-semibold">
                          {group.product_name} ({group.quantity})
                        </p>

                        <div className="mt-1 space-y-1">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              <span className="truncate">
                                SN: {item.serial_number}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-100 hover:text-red-500"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-center">{group.quantity}</p>

                      <p className="text-center">
                        ₱{group.selling_price.toFixed(2)}
                      </p>

                      <p className="text-right font-medium">
                        ₱{group.subtotal.toFixed(2)}
                      </p>

                      <p></p>
                    </div>
                  ))
                )}
              </div>

              <div className="shrink-0 border-t border-gray-300 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Total</p>

                    <h2 className="text-3xl font-black">
                      ₱{totalAmount.toFixed(2)}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={saving || invoiceItems.length === 0}
                    className="rounded-xl bg-[#3693a8] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Proceed to Payment →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentDetailsModal
        open={paymentDetailsOpen}
        onClose={() => setPaymentDetailsOpen(false)}
        items={invoiceItems}
        total={totalAmount}
        saving={saving}
        onSave={handleSaveInvoice}
        onPrint={handlePrintInvoice}
      />

      <PaymentActionModal
        open={paymentActionsOpen}
        onClose={() => {
          resetForm();
          setPaymentActionsOpen(false);
          setSavedInvoice(null);
          onClose();
        }}
        onPrintReceipt={() => {
          if (!savedInvoice) return;
          openPrintWindow(savedInvoice, 420, 650);
        }}
        onPrintInvoice={() => {
          if (!savedInvoice) return;

          const invoiceHTML = generateInvoiceHTML(savedInvoice);

          const printWindow = window.open("", "_blank", "width=900,height=700");

          if (!printWindow) {
            alert("Please allow popups");
            return;
          }

          printWindow.document.write(invoiceHTML);
          printWindow.document.close();
        }}
        onSavePDF={() => {
          alert("Save PDF coming soon");
        }}
        onSendEmail={() => {
          alert("Email feature coming soon");
        }}
      />
    </>
  );
}
