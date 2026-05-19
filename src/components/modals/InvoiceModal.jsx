import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import PaymentDetailsModal from "./PaymentDetailsModal";
import PaymentActionModal from "./PaymentActionModal";

export default function InvoiceModal({ open, onClose }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [paymentActionsOpen, setPaymentActionsOpen] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);

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
    if (!productSearch.trim() || selectedProduct) return [];

    return products
      .filter((product) =>
        product.product_name
          .toLowerCase()
          .includes(productSearch.toLowerCase()),
      )
      .slice(0, 6);
  }, [productSearch, products, selectedProduct]);

  const totalAmount = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [invoiceItems]);

  function normalizeName(name) {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function handleSelectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerName(customer.customer_name);
    setContactNumber(customer.contact_number || "");
    setEmail(customer.email || "");
  }

  function handleSelectProduct(product) {
    setSelectedProduct(product);
    setProductSearch(product.product_name);
  }

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

    if (itemQuantity > selectedProduct.stock_quantity) {
      alert("Quantity exceeds available stock");
      return;
    }

    const existingItem = invoiceItems.find(
      (item) => item.product_id === selectedProduct.product_id,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + itemQuantity;

      if (newQuantity > selectedProduct.stock_quantity) {
        alert("Quantity exceeds available stock");
        return;
      }

      setInvoiceItems((prev) =>
        prev.map((item) =>
          item.product_id === selectedProduct.product_id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: newQuantity * item.selling_price,
              }
            : item,
        ),
      );
    } else {
      setInvoiceItems((prev) => [
        ...prev,
        {
          product_id: selectedProduct.product_id,
          product_name: selectedProduct.product_name,
          quantity: itemQuantity,
          selling_price: Number(selectedProduct.selling_price),
          subtotal: itemQuantity * Number(selectedProduct.selling_price),
        },
      ]);
    }

    setSelectedProduct(null);
    setProductSearch("");
    setQuantity(1);
  }

  function handleRemoveItem(productId) {
    setInvoiceItems((prev) =>
      prev.filter((item) => item.product_id !== productId),
    );
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

      const newStock = product.stock_quantity - item.quantity;

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
      items: invoiceItems,
      total: totalAmount,
    };
  }

  function generateReceiptHTML(invoice) {
    const itemRows = invoice.items
      .map(
        (item) => `
          <tr>
            <td>${item.product_name}</td>
            <td class="center">${item.quantity}</td>
            <td class="right">${item.selling_price.toFixed(2)}</td>
            <td class="right">${item.subtotal.toFixed(2)}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: "Courier New", monospace;
              background: #ffffff;
              color: #000000;
              padding: 20px;
            }

            .receipt {
              width: 320px;
              margin: 0 auto;
            }

            .center {
              text-align: center;
            }

            .right {
              text-align: right;
            }

            .title {
              font-size: 18px;
              font-weight: bold;
              text-align: center;
            }

            .line {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }

            .info {
              font-size: 12px;
              line-height: 1.5;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }

            th {
              text-align: left;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
            }

            td {
              padding: 5px 0;
              vertical-align: top;
            }

            .total {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: bold;
              margin-top: 10px;
            }

            .footer {
              text-align: center;
              font-size: 12px;
              margin-top: 16px;
            }

            @media print {
              body {
                padding: 0;
              }

              .receipt {
                width: 100%;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <div class="title">E & R Computer Parts and Accessories Trading</div>

            <div class="line"></div>

            <div class="info">
              Invoice No: ${invoice.invoiceNumber}<br />
              Date: ${new Date(invoice.order.created_at).toLocaleString(
                "en-PH",
              )}<br />
              Payment: Cash<br />
              Status: Paid
            </div>

            <div class="line"></div>

            <div class="info">
              Customer:<br />
              ${invoice.customer.name}<br />
              ${invoice.customer.contact || "N/A"}<br />
              ${invoice.customer.email || ""}
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

            <div class="total">
              <span>TOTAL</span>
              <span>₱${invoice.total.toFixed(2)}</span>
            </div>

            <div class="line"></div>

            <div class="footer">
              Thank you for shopping!
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
  }
  function generateInvoiceHTML(invoice) {
    const itemRows = invoice.items
      .map(
        (item) => `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.quantity}</td>
          <td>₱${item.selling_price.toFixed(2)}</td>
          <td>₱${item.subtotal.toFixed(2)}</td>
        </tr>
      `,
      )
      .join("");

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #000;
          }

          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .store {
            font-size: 24px;
            font-weight: bold;
          }

          .invoice-title {
            font-size: 32px;
            font-weight: bold;
          }

          .info {
            margin-bottom: 25px;
            line-height: 1.6;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th,
          td {
            border: 1px solid #000;
            padding: 12px;
            text-align: left;
          }

          th {
            background: #f2f2f2;
          }

          .right {
            text-align: right;
          }

          .total {
            margin-top: 25px;
            text-align: right;
            font-size: 24px;
            font-weight: bold;
          }

          .footer {
            margin-top: 60px;
            font-size: 13px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div>
            <div class="store">E & R Computer Parts and Accessories Trading</div>
            <p>Sales & Inventory System</p>
          </div>

          <div class="invoice-title">INVOICE</div>
        </div>

        <div class="info">
          <strong>Invoice No:</strong> ${invoice.invoiceNumber}<br />
          <strong>Date:</strong> ${new Date(invoice.order.created_at).toLocaleString("en-PH")}<br />
          <strong>Payment:</strong> Cash<br />
          <strong>Status:</strong> Paid
        </div>

        <div class="info">
          <strong>Bill To:</strong><br />
          ${invoice.customer.name}<br />
          ${invoice.customer.contact || "N/A"}<br />
          ${invoice.customer.email || ""}
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

          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="total">
          TOTAL: ₱${invoice.total.toFixed(2)}
        </div>

        <div class="footer">
          This document serves as the official invoice for this transaction.
        </div>

        <script>
          window.onload = function () {
            window.print();
          };
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
    setQuantity(1);
    setInvoiceItems([]);
  }

  function handleCancel() {
    resetForm();
    setPaymentDetailsOpen(false);
    setPaymentActionsOpen(false);
    setSavedInvoice(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="max-h-[92vh] w-[880px] overflow-y-auto rounded-3xl bg-[#f4f4f4] p-6 shadow-2xl">
          <div className="mb-5">
            <h2 className="text-3xl font-black">Create Invoice</h2>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-base font-semibold">
              Customer Name
            </label>

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
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none"
              />

              {filteredCustomers.length > 0 && (
                <div className="absolute left-0 top-[44px] z-[130] max-h-[180px] w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-xl">
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
              <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-3">
                <p className="mb-2 text-sm font-semibold text-green-700">
                  Existing customer selected
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
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
              </div>
            )}

            {!selectedCustomer && customerName.trim() && (
              <div className="mt-3 rounded-2xl border border-[#3693a8]/20 bg-[#3693a8]/5 p-3">
                <p className="mb-2 text-sm font-semibold text-[#3693a8]">
                  New customer details
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Contact number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="h-10 rounded-xl border border-gray-300 bg-white px-4 outline-none"
                  />

                  <input
                    type="email"
                    placeholder="Email optional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 rounded-xl border border-gray-300 bg-white px-4 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-base font-semibold">
              Add Item
            </label>

            <div className="grid grid-cols-[1fr_90px_110px] gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search product..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setSelectedProduct(null);
                  }}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none"
                />

                {filteredProducts.length > 0 && (
                  <div className="absolute left-0 top-[44px] z-[120] max-h-[190px] w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-xl">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.product_id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-100"
                      >
                        <div>
                          <p className="font-semibold">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Stock: {product.stock_quantity}
                          </p>
                        </div>

                        <p className="font-bold">
                          ₱{Number(product.selling_price).toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-10 rounded-xl border border-gray-300 bg-white px-4 outline-none"
              />

              <button
                type="button"
                onClick={handleAddItem}
                className="h-10 rounded-xl bg-[#3693a8] text-white shadow-md transition hover:scale-105"
              >
                Add
              </button>
            </div>

            {selectedProduct && (
              <p className="mt-2 text-sm text-gray-500">
                Selected: {selectedProduct.product_name} • Stock:{" "}
                {selectedProduct.stock_quantity}
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white">
            <div className="grid grid-cols-5 border-b border-gray-300 bg-gray-50 px-5 py-3 text-sm font-semibold">
              <p>Product</p>
              <p className="text-center">Quantity</p>
              <p className="text-center">Price</p>
              <p className="text-right">Amount</p>
              <p></p>
            </div>

            <div className="min-h-[120px] px-5 py-3">
              {invoiceItems.length === 0 ? (
                <p className="py-8 text-center text-gray-400">
                  No items added yet.
                </p>
              ) : (
                invoiceItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="grid grid-cols-5 items-center py-2 text-sm"
                  >
                    <p>{item.product_name}</p>

                    <p className="text-center">{item.quantity}</p>

                    <p className="text-center">
                      ₱{item.selling_price.toFixed(2)}
                    </p>

                    <p className="text-right font-medium">
                      ₱{item.subtotal.toFixed(2)}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="text-right text-sm font-bold text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-gray-300 px-5 py-4">
              <div className="flex items-center gap-6">
                <p className="text-base font-semibold">Total</p>

                <h2 className="text-2xl font-black">
                  ₱{totalAmount.toFixed(2)}
                </h2>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl bg-[#cf7f88] px-7 py-2.5 text-white shadow-md transition hover:scale-105 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={saving}
              className="rounded-xl bg-[#3693a8] px-7 py-2.5 text-white shadow-md transition hover:scale-105 disabled:opacity-60"
            >
              Proceed to Payment →
            </button>
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
