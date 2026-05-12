import UserAvatarIcon from "../auth/UserAvatarIcon";
import { Search } from "lucide-react";

export default function TopBar() {
  return (
    <>
      <header className="fixed left-0 top-0 z-20 h-[70px] w-full bg-[#3693a8]" />

      <div className="fixed right-5 top-4 z-40 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          className="h-9 w-[210px] rounded-full bg-[#b9d8d6] px-4 text-sm italic outline-none placeholder:text-white"
        />

        <button
          onClick={() => console.log("Search button clicked")}
          className="transition hover:scale-110"
        >
          <Search className="h-7 w-7 cursor-pointer text-white" />
        </button>

        <button
          onClick={() => console.log("Account button clicked")}
          className="transition hover:scale-110"
        >
          <UserAvatarIcon className="h-8 w-8 cursor-pointer" />
        </button>
      </div>
    </>
  );
}