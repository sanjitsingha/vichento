"use client";

import { useAuthContext } from "@/context/AuthContext";
import Homepage from "./Pages/Homepage"; // authenticated feed
import LandingPage from "./Pages/LandingPages/LandingPage"; // public landing
import Sidebar from "./components/Sidebar";

export default function Home() {
  const { user, loading } = useAuthContext();

  // Blank page while auth state is being determined (avoids a landing-page flash)
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
        <div className="h-6 w-48 rounded-md shimmer" />
      </div>
    );
  }

  // Not logged in -> public landing page
  if (!user) {
    return <LandingPage />;
  }

  // Logged in -> personalised feed
  return (
    <div className="flex">
      <Sidebar />
      <main className="w-full min-w-0 flex-1">
        <Homepage />
      </main>
    </div>
  );
}
