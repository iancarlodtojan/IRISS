import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import UserAvatarIcon from "../../auth/UserAvatarIcon";
import { supabase } from "../../../lib/supabaseClient";

export default function TopBar({ onSearch }) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const role = localStorage.getItem("userRole");

  const displayRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "User";

  async function handleLogout() {
    await supabase.auth.signOut();

    localStorage.removeItem("userRole");

    navigate("/login", { replace: true });
  }

  function handleSearch() {
    onSearch(searchValue);
  }

  return (
    <header className="fixed left-0 top-0 z-20 flex h-[70px] w-full items-center justify-end bg-[#3693a8] px-5">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-9 w-[210px] rounded-full bg-[#b9d8d6] px-4 text-sm italic text-white outline-none placeholder:text-white"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="transition hover:scale-110"
        >
          <Search className="h-7 w-7 text-white" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="transition hover:scale-110"
          >
            <UserAvatarIcon className="h-8 w-8" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-[170px] rounded-xl bg-[#cf7f88] p-5 shadow-xl">
              <div className="mb-4 flex flex-col items-center">
                <UserAvatarIcon className="mb-2 h-8 w-8" />

                <p className="text-lg font-bold text-white">
                  {displayRole}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-[#d93f74] py-2 font-bold text-white transition hover:scale-105"
              >
                LOG OUT
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}