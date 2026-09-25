"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(() => {});

/** Lightweight global toast. `const toast = useToast(); toast("Saved")` or `toast("Oops", "error")`. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((msg, type = "ok") => {
    clearTimeout(timer.current);
    setToast({ msg, type, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 md:bottom-8 z-[10000] flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className={`animate-toast pointer-events-auto rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg ${
              toast.type === "error" ? "bg-red-600" : "bg-black"
            }`}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
