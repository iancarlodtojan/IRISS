import { useState, useEffect } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import FloatingAddButton from "./FloatingAddButton";

import InvoiceModal from "../../modals/InvoiceModal";
import ProductActionModal from "../../modals/ProductActionModal";
import RestockProductModal from "../../modals/RestockProductModal";
import AddNewProductModal from "../../modals/AddNewProductModal";

export default function AppLayout({ children, links = [], onSearch = null }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebarOpen");
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [productActionOpen, setProductActionOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [addNewProductOpen, setAddNewProductOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
    } catch {
      // ignore
    }
  }, [sidebarOpen]);

  const role = localStorage.getItem("userRole");

  const roleFloatingActions = {
    cashier: [
      {
        label: "Create Invoice",
        onClick: () => setInvoiceOpen(true),
      },
    ],

  };

  const floatingActions = roleFloatingActions[role] || [];

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <TopBar onSearch={onSearch} showSearch={onSearch !== null} />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        links={links}
      />

      <main
        className={`pb-32 pt-[95px] pr-8 transition-all duration-300 ${
          sidebarOpen ? "pl-[260px]" : "pl-6"
        }`}
      >
        {children}
      </main>

      {floatingActions.length > 0 && (
        <FloatingAddButton actions={floatingActions} />
      )}

      <InvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />

      <ProductActionModal
        open={productActionOpen}
        onClose={() => setProductActionOpen(false)}
        onAddExisting={() => {
          setProductActionOpen(false);
          setRestockOpen(true);
        }}
        onAddNew={() => {
          setProductActionOpen(false);
          setAddNewProductOpen(true);
        }}
      />

      <RestockProductModal
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
      />

      <AddNewProductModal
        open={addNewProductOpen}
        onClose={() => setAddNewProductOpen(false)}
      />
    </div>
  );
}
