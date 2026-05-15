import { Plus } from "lucide-react";

export default function FloatingAddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 rounded-full bg-[#d7888f] p-5 shadow-xl transition hover:scale-105"
    >
      <Plus className="h-8 w-8 text-white" />
    </button>
  );
}