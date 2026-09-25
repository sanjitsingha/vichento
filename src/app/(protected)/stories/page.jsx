"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrashIcon,
  ArrowTrendingUpIcon,
  EllipsisHorizontalIcon,
  ArrowUturnLeftIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { PiShareFatThin } from "react-icons/pi";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabaseClient";
import { formatDate, getExcerpt, getImageUrl, readingTime, shareLink } from "@/lib/articleUtils";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

const TABS = [
  { key: "drafts", label: "Drafts" },
  { key: "published", label: "Published" },
];

function RowMenu({ open, onToggle, children }) {
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
        aria-expanded={open}
        className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
      >
        <EllipsisHorizontalIcon className="h-6 w-6" />
      </button>
      {open && (
        <div className="animate-dropdown absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

const menuItem =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-gray-700 transition-colors hover:bg-gray-50";

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") === "published" ? "published" : "drafts";

  const { user } = useAuthContext();
  const toast = useToast();
  const [drafts, setDrafts] = useState([]);
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchArticles = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        toast("Couldn't load your stories", "error");
      } else {
        setDrafts(data.filter((item) => item.status === "draft"));
        setPublishedArticles(data.filter((item) => item.status === "published"));
      }
      setLoading(false);
    };

    fetchArticles();
  }, [user, toast]);

  const setTab = (key) => router.replace(`/stories?tab=${key}`, { scroll: false });

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { id, status } = pendingDelete;
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id);
    setDeleting(false);
    setPendingDelete(null);

    if (error) {
      console.error("Error deleting article:", error);
      toast("Failed to delete the story", "error");
      return;
    }
    if (status === "draft") setDrafts((prev) => prev.filter((item) => item.id !== id));
    else setPublishedArticles((prev) => prev.filter((item) => item.id !== id));
    toast("Story deleted");
  };

  const handleUnpublish = async (article) => {
    setActiveMenu(null);
    const { error } = await supabase
      .from("articles")
      .update({ status: "draft" })
      .eq("id", article.id)
      .eq("author_id", user.id);

    if (error) {
      console.error("Error unpublishing article:", error);
      toast("Failed to unpublish the story", "error");
      return;
    }

    setPublishedArticles((prev) => prev.filter((item) => item.id !== article.id));
    setDrafts((prev) => [{ ...article, status: "draft" }, ...prev]);
    toast("Moved to drafts");
  };

  const handleShare = async (article) => {
    setActiveMenu(null);
    const result = await shareLink({
      title: article.title,
      url: `${window.location.origin}/read/${article.slug || article.id}`,
    });
    if (result === "copied") toast("Link copied");
  };

  const list = activeTab === "drafts" ? drafts : publishedArticles;

  return (
    <div className="min-h-screen w-full bg-white pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-12 font-creato md:px-6 md:pt-16">
        {/* Header Section */}
        <div className="mb-10 flex w-full items-center justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black">Your stories</h1>
          <Link
            href="/write"
            className="flex shrink-0 items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800"
          >
            <PencilSquareIcon className="size-4" />
            Write a story
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-8 border-b border-gray-100">
          {TABS.map(({ key, label }) => {
            const count = key === "drafts" ? drafts.length : publishedArticles.length;
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

        {/* Content Area */}
        {loading ? (
          <div className="space-y-6 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 border-b border-gray-100 pb-6">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 rounded shimmer" />
                  <div className="h-3 w-1/3 rounded shimmer" />
                </div>
                <div className="hidden h-20 w-28 rounded shimmer sm:block" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-2 text-lg font-medium text-black">
              {activeTab === "drafts"
                ? "You have no drafts."
                : "You haven't published any stories yet."}
            </p>
            <p className="text-[15px] text-gray-500">
              {activeTab === "drafts"
                ? "Write a story that matters to you."
                : "Your published stories will appear here."}
            </p>
            <Link
              href="/write"
              className="mt-6 inline-block rounded-full border border-gray-300 px-5 py-2 text-sm text-black hover:border-black"
            >
              Start writing
            </Link>
          </div>
        ) : (
          <div className="flex flex-col">
            {list.map((article) => {
              const isDraft = article.status === "draft";
              const href = isDraft ? `/write/${article.id}` : `/read/${article.slug || article.id}`;
              const cover = getImageUrl(article.cover_image);
              const excerpt = getExcerpt(article, 140);

              return (
                <div key={article.id} className="group flex items-start gap-5 border-b border-gray-100 py-6">
                  <div className="min-w-0 flex-1">
                    <Link href={href}>
                      <h2 className="mb-1.5 line-clamp-2 text-[20px] font-bold leading-snug text-black decoration-gray-300 underline-offset-4 group-hover:underline">
                        {article.title || "Untitled draft"}
                      </h2>
                      {excerpt && (
                        <p className="mb-2 line-clamp-2 font-sans text-[15px] text-gray-500">
                          {excerpt}
                        </p>
                      )}
                    </Link>
                    <p className="font-sans text-[13px] text-gray-500">
                      {isDraft
                        ? `Last edited ${formatDate(article.updated_at || article.created_at, true)}`
                        : `Published ${formatDate(article.published_at || article.created_at, true)}`}
                      {" · "}
                      {readingTime(article.content)} min read
                    </p>
                  </div>

                  {cover && (
                    <div className="relative hidden h-[80px] w-[120px] shrink-0 overflow-hidden rounded bg-gray-100 sm:block">
                      <Image src={cover} fill sizes="120px" alt="" className="object-cover" />
                    </div>
                  )}

                  <RowMenu
                    open={activeMenu === article.id}
                    onToggle={(o) => setActiveMenu(o ? article.id : null)}
                  >
                    {isDraft ? (
                      <Link href={`/write/${article.id}`} className={menuItem}>
                        <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                        Continue writing
                      </Link>
                    ) : (
                      <>
                        <Link href={`/write/${article.id}`} className={menuItem}>
                          <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                          Edit story
                        </Link>
                        <Link href={`/stats/${article.id}`} className={menuItem}>
                          <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400" />
                          View stats
                        </Link>
                        <button onClick={() => handleShare(article)} className={menuItem}>
                          <PiShareFatThin className="h-4 w-4 text-gray-400" />
                          Share
                        </button>
                        <button onClick={() => handleUnpublish(article)} className={menuItem}>
                          <ArrowUturnLeftIcon className="h-4 w-4 text-gray-400" />
                          Unpublish
                        </button>
                      </>
                    )}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => {
                        setActiveMenu(null);
                        setPendingDelete(article);
                      }}
                      className={`${menuItem} text-red-600 hover:bg-red-50`}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                      {isDraft ? "Delete draft" : "Delete story"}
                    </button>
                  </RowMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete story?"
        description={`"${pendingDelete?.title || "Untitled draft"}" will be deleted permanently. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Page;
