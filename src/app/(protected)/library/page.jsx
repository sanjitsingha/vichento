"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PiShareFatThin } from "react-icons/pi";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, getExcerpt, getImageUrl, readingTime, shareLink } from "@/lib/articleUtils";
import Avatar from "@/app/components/ui/Avatar";

const ARTICLE_FIELDS = `
  id,
  title,
  slug,
  content,
  meta_description,
  cover_image,
  created_at,
  users!fk_author (
    id,
    name,
    username,
    avatar
  )
`;

const TABS = [
  { key: "your-list", label: "Your list" },
  { key: "history", label: "Reading history" },
];

function ItemMenu({ open, onToggle, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && onToggle(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onToggle]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => onToggle(!open)}
        aria-label="More options"
        className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
      >
        <EllipsisHorizontalIcon className="h-6 w-6" />
      </button>
      {open && (
        <div className="animate-dropdown absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function LibraryItem({ article, dateLabel, menu }) {
  const cover = getImageUrl(article.cover_image);
  const author = article.users || {};
  return (
    <div className="group flex items-start gap-5 border-b border-gray-100 py-6">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2 font-sans text-[13px] text-gray-600">
          <Avatar src={author.avatar} name={author.name} size={20} />
          <span className="truncate">{author.name || "Unknown"}</span>
        </div>
        <Link href={`/read/${article.slug || article.id}`}>
          <h2 className="mb-1.5 line-clamp-2 text-[20px] font-bold leading-snug text-black decoration-gray-300 underline-offset-4 group-hover:underline">
            {article.title}
          </h2>
          <p className="mb-2 line-clamp-2 font-sans text-[15px] text-gray-500">
            {getExcerpt(article, 140)}
          </p>
        </Link>
        <p className="font-sans text-[13px] text-gray-500">
          {dateLabel} · {readingTime(article.content)} min read
        </p>
      </div>

      {cover && (
        <div className="relative hidden h-[80px] w-[120px] shrink-0 overflow-hidden rounded bg-gray-100 sm:block">
          <Image src={cover} fill sizes="120px" alt="" className="object-cover" />
        </div>
      )}

      {menu}
    </div>
  );
}

const menuItem =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-gray-700 transition-colors hover:bg-gray-50";

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab =
    searchParams.get("tab") === "history" || searchParams.get("tab") === "watch-history"
      ? "history"
      : "your-list";

  const { user } = useAuthContext();
  const toast = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  // 🔹 Fetch Data
  useEffect(() => {
    if (!user) return;

    const fetchLibrary = async () => {
      setLoading(true);

      const [bookmarkRes, viewsRes] = await Promise.all([
        supabase
          .from("bookmarks")
          .select(`id, created_at, articles ( ${ARTICLE_FIELDS} )`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("views")
          .select(`id, created_at, article_id, articles ( ${ARTICLE_FIELDS} )`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (!bookmarkRes.error) {
        setBookmarks((bookmarkRes.data || []).filter((b) => b.articles));
      }

      if (!viewsRes.error) {
        // One entry per story, most recent read first.
        const seen = new Set();
        setHistory(
          (viewsRes.data || []).filter((v) => {
            if (!v.articles || seen.has(v.article_id)) return false;
            seen.add(v.article_id);
            return true;
          }),
        );
      }

      setLoading(false);
    };

    fetchLibrary();
  }, [user]);

  const setTab = (key) => router.replace(`/library?tab=${key}`, { scroll: false });

  const handleRemoveBookmark = async (bookmarkId) => {
    setActiveMenu(null);
    const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);

    if (error) {
      toast("Couldn't remove from your list", "error");
      return;
    }
    const removed = bookmarks.find((b) => b.id === bookmarkId);
    setBookmarks((prev) => prev.filter((item) => item.id !== bookmarkId));
    // Keep the cached bookmark set used by feed cards in sync.
    try {
      const stored = new Set(JSON.parse(localStorage.getItem("bookmarks") || "[]"));
      stored.delete(removed?.articles?.id);
      localStorage.setItem("bookmarks", JSON.stringify([...stored]));
    } catch {}
    toast("Removed from your list");
  };

  const handleShare = async (article) => {
    setActiveMenu(null);
    const result = await shareLink({
      title: article.title,
      url: `${window.location.origin}/read/${article.slug || article.id}`,
    });
    if (result === "copied") toast("Link copied");
  };

  const items = activeTab === "your-list" ? bookmarks : history;

  return (
    <div className="min-h-screen w-full bg-white pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-12 font-creato md:px-6 md:pt-16">
        <h1 className="mb-10 text-4xl font-semibold tracking-tight text-black">Library</h1>

        {/* Tabs */}
        <div className="mb-4 flex gap-8 border-b border-gray-100">
          {TABS.map(({ key, label }) => {
            const count = key === "your-list" ? bookmarks.length : history.length;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative pb-4 text-[15px] font-medium transition-colors ${
                  activeTab === key ? "text-black" : "text-gray-500 hover:text-black"
                }`}
              >
                {label}
                {count > 0 && <span className="ml-1.5 font-normal text-gray-400">{count}</span>}
                {activeTab === key && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-black" />
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-6 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 border-b border-gray-100 pb-6">
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-1/4 rounded shimmer" />
                  <div className="h-5 w-3/4 rounded shimmer" />
                  <div className="h-3 w-1/3 rounded shimmer" />
                </div>
                <div className="hidden h-20 w-28 rounded shimmer sm:block" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-2 text-lg font-medium text-black">
              {activeTab === "your-list" ? "Your list is empty." : "No reading history yet."}
            </p>
            <p className="text-[15px] text-gray-500">
              {activeTab === "your-list"
                ? "Tap the bookmark icon on any story to save it for later."
                : "Stories you read will appear here."}
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-block rounded-full border border-gray-300 px-5 py-2 text-sm text-black hover:border-black"
            >
              Find something to read
            </Link>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => (
              <LibraryItem
                key={item.id}
                article={item.articles}
                dateLabel={
                  activeTab === "your-list"
                    ? `Saved ${formatDate(item.created_at)}`
                    : `Read ${formatDate(item.created_at)}`
                }
                menu={
                  <ItemMenu
                    open={activeMenu === item.id}
                    onToggle={(o) => setActiveMenu(o ? item.id : null)}
                  >
                    <button onClick={() => handleShare(item.articles)} className={menuItem}>
                      <PiShareFatThin className="h-4 w-4 text-gray-400" />
                      Share
                    </button>
                    {activeTab === "your-list" && (
                      <button
                        onClick={() => handleRemoveBookmark(item.id)}
                        className={`${menuItem} text-red-600 hover:bg-red-50`}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                        Remove from list
                      </button>
                    )}
                  </ItemMenu>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
