import { useState, useEffect } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import FloatingAddButton from "./FloatingAddButton";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebarOpen");
      return raw ? JSON.parse(raw) : false;
    } catch  {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
    } catch  {
      // ignore
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <TopBar />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main
        className={`pb-32 pt-[95px] pr-8 transition-all duration-300 ${
          sidebarOpen ? "pl-[220px]" : "pl-[40px]"
        }`}
      >
        {children}
      </main>

      <FloatingAddButton />
    </div>
  );
}