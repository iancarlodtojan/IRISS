import { useState } from "react";
import { Plus } from "lucide-react";

export default function FloatingAddButton({ actions = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {/* ACTION BUTTONS */}
      {open &&
        actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="rounded-2xl bg-[#cf4f74] px-5 py-3 text-white shadow-xl transition hover:scale-105"
          >
            {action.label}
          </button>
        ))}

      {/* MAIN FLOATING BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-[#d7888f] p-5 shadow-xl transition hover:scale-105"
      >
        <Plus className="h-8 w-8 text-white" />
      </button>
    </div>
  );
}