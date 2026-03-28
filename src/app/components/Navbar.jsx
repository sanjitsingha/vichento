"use client";

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { logoutUser } from "@/lib/logout";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/appwrite";
import Image from "next/image";

import { MdArrowOutward } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import { HiMenuAlt2, HiX } from "react-icons/hi";
import { PencilSquareIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  HomeIcon,
  UserIcon,
  BookOpenIcon,
  ChartBarIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { user, loading, setUser } = useAuthContext();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const getAvatarUrl = () => {
    if (!user?.prefs?.avatar) return "/default-avatar.png";
    return storage.getFileView("article-images", user.prefs.avatar);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSidebarOpen(false);
    router.refresh();
  };

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <div className="w-full border-b border-gray-300 h-[64px] sticky top-0 z-50 bg-white">
        <div className="px-4 md:px-10 h-full flex justify-between items-center">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            {!loading && user && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden"
              >
                <HiMenuAlt2 size={26} />
              </button>
            )}

            <Link href="/" className="text-xl text-secondary font-semibold">
              <Image
                src="/vichento_logo_black.png"
                alt="logo"
                width={100}
                height={100}
              />

              
            </Link>

            {/* Desktop search */}
            {!loading && user && (
              <div className="hidden md:flex items-center relative ml-4">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchValue.trim()) {
                      router.push(`/search?q=${searchValue}`);
                      setSearchValue("");
                    }
                  }}
                  placeholder="Search topics"
                  className="outline-none text-sm w-[260px] bg-gray-100 py-2 px-3 rounded-full"
                />
                <CiSearch className="absolute right-3" size={18} />
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-5">
            {/* Mobile search icon */}
            {!loading && user && (
              <button
                className="md:hidden"
                onClick={() => router.push("/search")}
              >
                <CiSearch size={22} />
              </button>
            )}

            {!loading && !user && (
              <Link
                href="/signin"
                className="text-sm bg-black text-white px-6 py-2 rounded-full"
              >
                Sign in
              </Link>
            )}

            {!loading && user && (
              <>
              {/* <Link href={"/report-bug"} className="hidden md:flex items-center py-1 gap-2 border px-4 rounded bg-yellow-100 border-yellow-300 text-sm">
               <ExclamationTriangleIcon className="size-5 text-yellow-700" />
                <p className="font-creato text-yellow-700">Report Bug</p>
              </Link> */}
                <Link
                  href="/write"
                  className="hidden md:flex items-center gap-2 border-r pr-6 border-gray-300 text-sm"
                >
                  <PencilSquareIcon className="size-5 text-black/60" />
                  <span className="text-black/70">Write</span>
                </Link>

                <Link href="/profile">
                  <img
                    src={getAvatarUrl()}
                    className="w-8 h-8 p-[2px]  border-primary border  rounded-full object-cover"
                    alt="avatar"
                  />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE SIDEBAR ================= */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-[260px] bg-white z-50 p-5 ">
            <div className="flex justify-between items-center mb-12">
              <p className="text-lg font-semibold">Menu</p>
              <button onClick={() => setSidebarOpen(false)}>
                <HiX size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-6 text-sm">
              <Link className="flex gap-2 text-gray-700 items-center" href="/" onClick={() => setSidebarOpen(false)}>
                <HomeIcon className="size-5"/> Home
              </Link>

              <Link className="flex gap-2 items-center text-gray-700" href="/library" onClick={() => setSidebarOpen(false)}>
                <BookOpenIcon className="size-5"/>
                Library
              </Link>

              <Link className="text-gray-700 flex gap-2 items-center" href="/profile" onClick={() => setSidebarOpen(false)}>
              <UserIcon className="size-5"/>
                Profile
              </Link>

              <Link className="text-gray-700 flex gap-2 items-center" href="/stories" onClick={() => setSidebarOpen(false)}>
                <QueueListIcon className="size-5"/>
                Stories
              </Link>

              <Link className="text-gray-700 flex gap-2 items-center" href="/stats" onClick={() => setSidebarOpen(false)}>
              <ChartBarIcon className="size-5"/>
                Stats
              </Link>

              {/* <button
                onClick={handleLogout}
                className="text-left text-red-600 mt-6"
              >
                Logout
              </button> */}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
