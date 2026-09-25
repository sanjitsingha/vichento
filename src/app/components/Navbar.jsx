"use client";

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import { CiSearch } from "react-icons/ci";
import { HiMenuAlt2, HiX } from "react-icons/hi";
import {
  PencilSquareIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  UserIcon,
  BookOpenIcon,
  ChartBarIcon,
  QueueListIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Avatar from "./ui/Avatar";

const NAV_LINKS = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Library", href: "/library", icon: BookOpenIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
  { name: "Stories", href: "/stories", icon: QueueListIcon },
  { name: "Stats", href: "/stats", icon: ChartBarIcon },
];

const Navbar = () => {
  const { user, profile, loading, signOut } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef(null);

  const displayName =
    profile?.name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || "You";
  const avatarSrc = profile?.avatar || user?.user_metadata?.avatar_url || null;
  const profileHref = profile?.username ? `/profile/${profile.username}` : "/profile";

  // Close the account menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setSidebarOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchValue("");
  };

  // Cream-coloured pages get a matching header.
  const onLanding = (pathname === "/" && !loading && !user) || pathname === "/early-access";

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header
        className={`sticky top-0 z-50 h-[64px] w-full border-b backdrop-blur ${
          onLanding
            ? "border-black/10 bg-[#fbfaf7]"
            : "border-gray-200 bg-white/95 supports-[backdrop-filter]:bg-white/85"
        }`}
      >
        <div className="flex h-full items-center justify-between px-4 md:px-10">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            {!loading && user && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="-ml-1 rounded-full p-1 md:hidden"
                aria-label="Open menu"
              >
                <HiMenuAlt2 size={26} />
              </button>
            )}

            <Link href="/" aria-label="Vichento home" className="shrink-0">
              <Image
                src="/vichento_logo_black.png"
                alt="Vichento"
                width={100}
                height={100}
                priority
                className="h-auto w-[100px]"
              />
            </Link>

            {/* Desktop search */}
            {!loading && user && (
              <form
                onSubmit={submitSearch}
                role="search"
                className="relative ml-4 hidden items-center md:flex"
              >
                <CiSearch className="absolute left-3 text-gray-500" size={18} />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search stories"
                  aria-label="Search stories"
                  className="w-[260px] rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm text-black outline-none transition-colors placeholder:text-gray-500 focus:bg-gray-200/70"
                />
              </form>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Signed-out */}
            {!loading && !user && (
              <>
                <Link
                  href="/signin"
                  className="hidden items-center gap-2 text-sm text-black/70 transition-colors hover:text-black sm:flex"
                >
                  <PencilSquareIcon className="size-5" />
                  Write
                </Link>
                <Link
                  href="/signin"
                  className="hidden text-sm text-black/70 transition-colors hover:text-black sm:block"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-black px-5 py-2 text-sm text-white transition-colors hover:bg-gray-800"
                >
                  Get started
                </Link>
              </>
            )}

            {/* Signed-in */}
            {!loading && user && (
              <>
                <Link
                  href="/search"
                  className="rounded-full p-1 md:hidden"
                  aria-label="Search"
                >
                  <CiSearch size={24} />
                </Link>

                <Link
                  href="/write"
                  className="hidden items-center gap-2 border-r border-gray-200 pr-6 text-sm text-black/70 transition-colors hover:text-black md:flex"
                >
                  <PencilSquareIcon className="size-5" />
                  Write
                </Link>

                <Link
                  href="/report-bug"
                  className="hidden items-center gap-2 border-r border-gray-200 pr-6 text-sm text-yellow-700 transition-colors hover:text-yellow-800 lg:flex"
                >
                  <ExclamationTriangleIcon className="size-5" />
                  <span className="font-creato">Report Bug</span>
                </Link>

                {/* Account menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Account menu"
                    className="flex rounded-full ring-offset-2 transition-shadow hover:ring-2 hover:ring-gray-200"
                  >
                    <Avatar src={avatarSrc} name={displayName} size={32} />
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="animate-dropdown absolute right-0 top-11 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                    >
                      <Link
                        href={profileHref}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
                      >
                        <Avatar src={avatarSrc} name={displayName} size={40} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-black">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500">View profile</p>
                        </div>
                      </Link>

                      <div className="my-2 border-t border-gray-100" />

                      {[
                        { name: "Write", href: "/write", icon: PencilSquareIcon, mobileOnly: true },
                        { name: "Library", href: "/library", icon: BookOpenIcon },
                        { name: "Stories", href: "/stories", icon: QueueListIcon },
                        { name: "Stats", href: "/stats", icon: ChartBarIcon },
                        {
                          name: "Settings",
                          href: profile?.username
                            ? `/profile/${profile.username}?settings=true`
                            : "/profile",
                          icon: Cog6ToothIcon,
                        },
                        { name: "Report a bug", href: "/report-bug", icon: ExclamationTriangleIcon },
                      ].map(({ name, href, icon: Icon, mobileOnly }) => (
                        <Link
                          key={name}
                          href={href}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 px-5 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-black ${
                            mobileOnly ? "md:hidden" : ""
                          }`}
                        >
                          <Icon className="size-5" />
                          {name}
                        </Link>
                      ))}

                      <div className="my-2 border-t border-gray-100" />

                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full px-5 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-black"
                      >
                        Sign out
                        <span className="mt-0.5 block truncate text-xs text-gray-400">
                          {user.email}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= MOBILE DRAWER ================= */}
      {user && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 md:hidden ${
              sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />

          <aside
            aria-hidden={!sidebarOpen}
            className={`fixed left-0 top-0 z-[70] flex h-full w-[85%] max-w-[320px] flex-col bg-white p-5 transition-transform duration-300 ease-in-out md:hidden ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-10 flex items-center justify-between">
              <Link href="/" onClick={() => setSidebarOpen(false)}>
                <Image
                  src="/vichento_logo_black.png"
                  alt="Vichento"
                  width={100}
                  height={100}
                  className="h-auto w-[100px]"
                />
              </Link>
              <button
                className="rounded-full bg-gray-100 p-2"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <HiX size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[17px] transition-colors ${
                    isActive(href) ? "bg-gray-100 text-black" : "text-gray-600"
                  }`}
                >
                  <Icon className="size-6" />
                  {name}
                </Link>
              ))}

              <Link
                href="/write"
                onClick={() => setSidebarOpen(false)}
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-[15px] text-white"
              >
                <PencilSquareIcon className="size-5" />
                Write a story
              </Link>
            </nav>

            <div className="mt-auto space-y-1 border-t border-gray-100 pt-4">
              <Link
                href="/report-bug"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-[15px] text-yellow-700"
              >
                <ExclamationTriangleIcon className="size-5" />
                Report a bug
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] text-gray-600"
              >
                <ArrowRightStartOnRectangleIcon className="size-5" />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Navbar;
