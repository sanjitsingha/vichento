"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function Modal({
  open,
  onOpenChange,
  children,
  size = "md",
  title = "Dialog",
  hideClose = false,
}) {
  const maxWidthClass =
    size === "large" ? "max-w-4xl" : size === "sm" ? "max-w-sm" : "max-w-md";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]" />

        <Dialog.Content
          aria-describedby={undefined}
          className={`modal-content fixed left-1/2 top-1/2 z-[9999] max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl focus:outline-none ${maxWidthClass}`}
        >
          {/* Screen-reader title (visible headings live in children) */}
          <Dialog.Title className="sr-only">{title}</Dialog.Title>

          {!hideClose && (
            <Dialog.Close
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
            >
              <XMarkIcon className="size-5" />
            </Dialog.Close>
          )}

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
