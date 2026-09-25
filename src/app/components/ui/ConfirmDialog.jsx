"use client";
import Modal from "./Modal";

/** Replacement for window.confirm with the site's look. */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" title={title} hideClose>
      <div className="text-center">
        <h2 className="font-creato text-xl font-bold text-black">{title}</h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
        )}
        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 transition-colors hover:border-black hover:text-black"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
