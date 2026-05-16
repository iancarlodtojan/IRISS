// AppLayout.jsx

import { useState, useEffect } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import FloatingAddButton from "./FloatingAddButton";

import InvoiceModal from "../../modals/InvoiceModal";

export default function AppLayout({
  children,
  links = [],
  onSearch = () => {},
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebarOpen");
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  const [invoiceOpen, setInvoiceOpen] = useState(false);

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
        onClick: () => {
          setInvoiceOpen(true);
        },
      },
    ],
  };

  const floatingActions = roleFloatingActions[role] || [];

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <TopBar onSearch={onSearch} />

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

      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />
    </div>
  );
}