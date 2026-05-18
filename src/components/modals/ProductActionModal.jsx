import { Plus, X } from "lucide-react";

export default function ProductActionModal({
  open,
  onClose,
  onAddExisting,
  onAddNew,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-[430px] rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 transition hover:scale-110"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#7bd874]">
          <Plus className="h-8 w-8 text-black" />
        </div>

        <h2 className="mb-2 text-3xl font-black">Add Product</h2>

        <p className="mb-5 text-sm text-black">
          What type of product would you like to add?
        </p>

        <div className="flex items-center justify-center gap-10">
          <button
            type="button"
            onClick={onAddExisting}
            className="w-[115px] rounded-xl bg-[#eeeeee] px-4 py-3 text-sm font-semibold leading-tight text-black shadow-sm transition hover:scale-105 hover:bg-gray-200"
          >
            Add Existing Product
          </button>

          <button
            type="button"
            onClick={onAddNew}
            className="w-[115px] rounded-xl bg-[#3693a8] px-4 py-3 text-sm font-semibold leading-tight text-white shadow-md transition hover:scale-105"
          >
            Add New Product
          </button>
        </div>
      </div>
    </div>
  );
}