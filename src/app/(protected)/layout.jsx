"use client";

import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";

export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="flex">
        {/* Sidebar (desktop only) */}
        <Sidebar />

        {/* Main page content */}
        <div className="flex-1">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      {/* <MobileNav /> */}
    </ProtectedRoute>
  );
}
