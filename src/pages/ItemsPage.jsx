import DashboardLayout from "../components/layout/DashboardLayout";
import { Pencil, Trash2 } from "lucide-react";

export default function InventoryPage() {
  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black">INVENTORY</h1>

        <button className="rounded-xl bg-[#b9d8d6] px-5 py-2 text-sm text-white shadow-md transition hover:scale-105">
          Add Product
        </button>
      </div>

      {/* INVENTORY TABLE */}
      <div className="rounded-2xl bg-[#f4f4f4] p-4 shadow-md">
        {/* TABLE HEADER */}
        <div className="grid grid-cols-6 border-b border-gray-300 pb-4 text-sm">
          <p>Product Name</p>
          <p>Quantity</p>
          <p>Price</p>
          <p>Cost</p>
          <p>Status</p>
          <p></p>
        </div>

        {/* ROW 1 */}
        <div className="grid grid-cols-6 items-center border-b border-gray-300 py-6 text-sm">
          <p className="font-medium">Ryzen</p>
          <p>25</p>
          <p>$15</p>
          <p>$10</p>
          <p className="text-green-600">In Stock</p>

          <div className="flex items-center gap-3">
            <button className="transition hover:scale-110">
              <Pencil className="h-4 w-4 text-gray-600" />
            </button>

            <button className="transition hover:scale-110">
              <Trash2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-6 items-center border-b border-gray-300 py-6 text-sm">
          <p className="font-medium">Pepsi</p>
          <p>10</p>
          <p>$12</p>
          <p>$8</p>
          <p className="text-yellow-600">Low Stock</p>

          <div className="flex items-center gap-3">
            <button className="transition hover:scale-110">
              <Pencil className="h-4 w-4 text-gray-600" />
            </button>

            <button className="transition hover:scale-110">
              <Trash2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* EMPTY SPACE */}
        <div className="h-[420px]" />
      </div>
    </DashboardLayout>
  );
}