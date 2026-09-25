"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import useUserActions from "@/hooks/useUserActions";
import { toCardArticle } from "@/lib/articleUtils";
import { CATEGORIES } from "@/lib/constants";
import ShimmerArticle from "../components/ShimmerArticle";
import YourReadingLIst from "../components/YourReadingLIst";
import StoriesCardHorizontal from "../components/StoriesCardHorizontal";
import RecomendedTopics from "../components/RecomendedTopics";

const PAGE_SIZE = 10;
const TABS = [
  { key: "for-you", label: "For you" },
  { key: "explore", label: "Latest" },
];

/* Inline topic picker shown when "For you" has nothing to personalise with. */
function InterestPicker({ onSaved }) {
  const { user, refreshProfile } = useAuthContext();
  const toast = useToast();
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (t) =>
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ interests: picked })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast("Couldn't save your topics", "error");
      return;
    }
    await refreshProfile();
    toast("Your feed is personalised");
    onSaved?.();
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-6 md:p-8">
      <h2 className="font-creato text-2xl font-bold tracking-tight text-black">
        What do you like to read?
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Pick at least 3 topics and we&apos;ll tailor this feed for you.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((t) => {
          const on = picked.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              aria-pressed={on}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                on
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-700 hover:border-black"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
      <button
        onClick={save}
        disabled={picked.length < 3 || saving}
        className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
      >
        {saving ? "Saving…" : `Continue${picked.length ? ` (${picked.length})` : ""}`}
      </button>
    </div>
  );
}

export default function Homepage() {
  const { user, profile } = useAuthContext();
  const [activeTab, setActiveTab] = useState("for-you");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { likes, bookmarks, toggleLike, toggleBookmark } = useUserActions(user);

  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const interestKey = interests.join("|");
  const needsInterests = activeTab === "for-you" && profile && interests.length === 0;

  /* ================= FETCH ARTICLES ================= */
  const fetchPage = useCallback(
    async (offset) => {
      let query = supabase
        .from("articles")
        .select(
          `
            *,
            users (
              id,
              name,
              username,
              avatar
            )
          `,
        )
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (activeTab === "for-you" && interestKey) {
        query = query.overlaps("categories", interestKey.split("|"));
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      return (data || []).map(toCardArticle);
    },
    [activeTab, interestKey],
  );

  useEffect(() => {
    if (needsInterests) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const page = await fetchPage(0);
        if (cancelled) return;
        setArticles(page);
        setHasMore(page.length === PAGE_SIZE);
      } catch (err) {
        console.error("Homepage fetch error:", err);
        if (!cancelled) {
          setArticles([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, needsInterests, reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await fetchPage(articles.length);
      setArticles((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-[1200px] gap-16 px-4 md:px-8">
        {/* LEFT */}
        <div className="min-w-0 flex-1 pb-20 lg:max-w-[700px]">
          {/* Tabs */}
          <div className="sticky top-[64px] z-10 -mx-4 mb-4 bg-white px-4 pt-6 md:mx-0 md:px-0">
            <div className="flex gap-8 border-b border-gray-100">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`-mb-px border-b pb-3 text-sm transition-colors ${
                    activeTab === tab.key
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {needsInterests ? (
            <InterestPicker />
          ) : loading ? (
            Array.from({ length: 5 }).map((_, i) => <ShimmerArticle key={i} />)
          ) : error ? (
            <div className="py-16 text-center">
              <p className="font-creato text-lg font-bold text-black">
                We couldn&apos;t load stories right now.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Check your connection and try again.
              </p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-6 rounded-full border border-gray-300 px-5 py-2 text-sm hover:border-black"
              >
                Try again
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-creato text-lg font-bold text-black">
                {activeTab === "for-you"
                  ? "No stories match your interests yet."
                  : "No stories published yet."}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Why not be the first? Every great publication starts with one story.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/write"
                  className="rounded-full bg-black px-5 py-2 text-sm text-white hover:bg-gray-800"
                >
                  Write a story
                </Link>
                <Link
                  href="/explore"
                  className="rounded-full border border-gray-300 px-5 py-2 text-sm hover:border-black"
                >
                  Explore topics
                </Link>
              </div>
            </div>
          ) : (
            <>
              {articles.map((article) => (
                <StoriesCardHorizontal
                  key={article.id}
                  article={article}
                  isLiked={likes.has(article.id)}
                  isBookmarked={bookmarks.has(article.id)}
                  onLike={toggleLike}
                  onBookmark={toggleBookmark}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-10">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="rounded-full border border-gray-300 px-6 py-2 text-sm text-gray-700 transition-colors hover:border-black hover:text-black disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Show more stories"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT */}
        <aside className="hidden w-[320px] shrink-0 border-l border-gray-100 pl-10 lg:block">
          <div className="sticky top-[64px] space-y-10 pt-8">
            <YourReadingLIst />
            <RecomendedTopics />

            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-6">
              {[
                ["Help", "/report-bug"],
                ["Privacy", "/privacy-policy"],
                ["Terms", "/terms-and-conditions"],
                ["Explore", "/explore"],
              ].map(([label, href]) => (
                <Link key={label} className="text-xs text-gray-500 hover:text-black" href={href}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
