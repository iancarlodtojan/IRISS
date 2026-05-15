import { useState, useEffect } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import FloatingAddButton from "./FloatingAddButton";

export default function AppLayout({
  children,
  links = [],

  // SET UP SEARCH FUNCTION PER PAGE
  onSearch = () => {},

  // SET UP FLOATING BUTTON FUNCTION PER PAGE
  floatingButton = {
    show: true,
    onClick: () => console.log("Floating add button clicked"),
  },
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebarOpen");
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
    } catch {
      // ignore
    }
  }, [sidebarOpen]);

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

      {floatingButton.show && (
        <FloatingAddButton onClick={floatingButton.onClick} />
      )}
    </div>
  );
}