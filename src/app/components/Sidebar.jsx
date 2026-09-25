"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon as HomeOutline,
  UserIcon as UserOutline,
  BookOpenIcon as BookOutline,
  ChartBarIcon as ChartOutline,
  QueueListIcon as QueueOutline,
} from "@heroicons/react/24/outline";

import {
  HomeIcon as HomeSolid,
  UserIcon as UserSolid,
  BookOpenIcon as BookSolid,
  ChartBarIcon as ChartSolid,
  QueueListIcon as QueueSolid,
} from "@heroicons/react/24/solid";

const menu = [
  { name: "Home", href: "/", outline: HomeOutline, solid: HomeSolid },
  { name: "Library", href: "/library", outline: BookOutline, solid: BookSolid },
  { name: "Profile", href: "/profile", outline: UserOutline, solid: UserSolid },
  {
    name: "Stories",
    href: "/stories",
    outline: QueueOutline,
    solid: QueueSolid,
  },
  { name: "Stats", href: "/stats", outline: ChartOutline, solid: ChartSolid },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[64px] hidden h-[calc(100vh-64px)] w-60 shrink-0 flex-col py-8 md:flex">
      <nav className="flex flex-col gap-1 px-6">
        {menu.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = active ? item.solid : item.outline;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 px-6 py-2.5 text-[15px] transition-colors ${
                active ? "text-black" : "text-black/50 hover:text-black"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-black" />
              )}
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 px-12 text-[11px] text-black/35">
        <Link href="/privacy-policy" className="hover:text-black/70">
          Privacy
        </Link>
        <Link href="/terms-and-conditions" className="hover:text-black/70">
          Terms
        </Link>
        <Link href="/report-bug" className="hover:text-black/70">
          Help
        </Link>
      </div>
    </aside>
  );
}
