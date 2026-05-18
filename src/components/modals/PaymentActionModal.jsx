import {
  FileText,
  Mail,
  Printer,
  X,
} from "lucide-react";

export default function PaymentActionModal({
  open,
  onClose,
  onPrintReceipt,
  onPrintInvoice,
  onSavePDF,
  onSendEmail,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-[820px] rounded-3xl bg-white px-14 py-16 shadow-2xl">
        {/* CLOSE */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 transition hover:scale-110"
        >
          <X className="h-6 w-6" />
        </button>

        {/* TITLE */}
        <h2 className="mb-10 text-center text-2xl font-black">
          What would you like to print?
        </h2>

        {/* PRINT OPTIONS */}
        <div className="mb-14 grid grid-cols-2 gap-12">
          {/* RECEIPT */}
          <button
            type="button"
            onClick={onPrintReceipt}
            className="flex h-[140px] flex-col items-center justify-center border border-gray-300 bg-white transition hover:scale-[1.02] hover:bg-gray-50"
          >
            <Printer className="mb-3 h-11 w-11" />

            <span className="text-base">
              Print Receipt
            </span>
          </button>

          {/* INVOICE */}
          <button
            type="button"
            onClick={onPrintInvoice}
            className="flex h-[140px] flex-col items-center justify-center border border-gray-300 bg-white transition hover:scale-[1.02] hover:bg-gray-50"
          >
            <Printer className="mb-3 h-11 w-11" />

            <span className="text-base">
              Print Invoice
            </span>
          </button>
        </div>

        {/* SUBTITLE */}
        <h3 className="mb-8 text-center text-2xl font-black">
          Additional Actions
        </h3>

        {/* ADDITIONAL */}
        <div className="mb-14 grid grid-cols-2 gap-12">
          {/* PDF */}
          <button
            type="button"
            onClick={onSavePDF}
            className="flex h-[140px] flex-col items-center justify-center border border-gray-300 bg-white transition hover:scale-[1.02] hover:bg-gray-50"
          >
            <FileText className="mb-3 h-11 w-11" />

            <span className="text-base">
              Save as PDF
            </span>
          </button>

          {/* EMAIL */}
          <button
            type="button"
            onClick={onSendEmail}
            className="flex h-[140px] flex-col items-center justify-center border border-gray-300 bg-white transition hover:scale-[1.02] hover:bg-gray-50"
          >
            <Mail className="mb-3 h-11 w-11" />

            <span className="text-base">
              Send to Email
            </span>
          </button>
        </div>

        {/* DONE */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#cf7f88] px-8 py-3 text-sm text-white shadow-md transition hover:scale-105"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}