import PageLayout from "../components/layout/PageLayout";

export default function InventoryPage() {
  return (
    <PageLayout>
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


        {/* EMPTY SPACE */}
        <div className="h-[420px]" />
      </div>
    </PageLayout>
  );
}