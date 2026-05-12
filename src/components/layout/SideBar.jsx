import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const linkClass = ({ isActive }) =>
    `block w-full px-8 py-5 text-left text-base transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-[#3693a8] text-white font-bold shadow-lg rounded-lg mx-2 border-l-4 border-white"
        : "font-normal text-black hover:bg-[#c2e3e6]"
    }`;

  return (
    <>
      {/* TOP LEFT MENU / IRISS */}
      <div
        className={`fixed left-0 top-0 z-50 flex h-[70px] items-center bg-[#3693a8] transition-all duration-300 ${
          sidebarOpen ? "w-[190px]" : "w-[70px] justify-center"
        }`}
      >
        {sidebarOpen && (
          <h1 className="ml-6 text-[28px] font-black tracking-[-2px] text-black">
            IRISS
          </h1>
        )}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 ${
            sidebarOpen ? "right-4" : "left-1/2 -translate-x-1/2"
          }`}
        >
          <Menu className="h-7 w-7 text-white" />
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-[70px] z-40 h-[calc(100vh-70px)] overflow-hidden bg-[#d9eff1] shadow-md transition-all duration-300 ${
          sidebarOpen ? "w-[190px]" : "w-0"
        }`}
      >
        <nav className="space-y-5 pt-1">
          <NavLink to="/dashboard" className={linkClass}>
            HOME
          </NavLink>

          <NavLink to="/items" className={linkClass}>
            ITEMS
          </NavLink>

          <NavLink to="/logs" className={linkClass}>
            LOGS
          </NavLink>

          <NavLink to="/customers" className={linkClass}>
            CUSTOMERS
          </NavLink>
        </nav>
      </aside>
    </>
  );
}