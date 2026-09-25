"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";

function PageFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pt-16">
      <div className="h-9 w-48 rounded shimmer" />
      <div className="h-4 w-full rounded shimmer" />
      <div className="h-4 w-2/3 rounded shimmer" />
    </div>
  );
}

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();
  // The editor is a focused, full-width writing surface (like Medium's).
  const focusMode = pathname.startsWith("/write");

  return (
    <ProtectedRoute>
      <div className="flex">
        {!focusMode && <Sidebar />}

        <div className="w-full min-w-0 flex-1">
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}
