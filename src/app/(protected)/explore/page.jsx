"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import useUserActions from "@/hooks/useUserActions";
import { toCardArticle } from "@/lib/articleUtils";
import { CATEGORIES } from "@/lib/constants";
import ShimmerArticle from "@/app/components/ShimmerArticle";
import StoriesCardHorizontal from "@/app/components/StoriesCardHorizontal";

const PAGE_SIZE = 20;

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user } = useAuthContext();
  const { likes, bookmarks, toggleLike, toggleBookmark } = useUserActions(user);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Selected topics live in the URL (?category=A&category=B) so they're shareable.
  const activeCategories = searchParams
    .getAll("category")
    .map((c) => CATEGORIES.find((k) => k.toLowerCase() === c.toLowerCase()) || c);
  const categoryKey = activeCategories.join("|");

  const buildQuery = (offset) => {
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

    if (categoryKey) {
      // Articles whose categories contain ANY of the selected topics
      query = query.overlaps("categories", categoryKey.split("|"));
    }
    return query;
  };

  /* ================= FETCH ARTICLES ================= */
  useEffect(() => {
    let cancelled = false;

    const fetchArticles = async () => {
      setLoading(true);
      const { data, error } = await buildQuery(0);
      if (cancelled) return;
      if (error) console.error("Explore fetch error:", error);
      const page = (data || []).map(toCardArticle);
      setArticles(page);
      setHasMore(page.length === PAGE_SIZE);
      setLoading(false);
    };

    fetchArticles();
    return () => {
      cancelled = true;
    };
    // buildQuery only depends on categoryKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    const { data } = await buildQuery(articles.length);
    const page = (data || []).map(toCardArticle);
    setArticles((prev) => [...prev, ...page]);
    setHasMore(page.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  /* ================= CATEGORY TOGGLE ================= */
  const toggleCategory = (category) => {
    const next = activeCategories.includes(category)
      ? activeCategories.filter((c) => c !== category)
      : [...activeCategories, category];
    const qs = next.map((c) => `category=${encodeURIComponent(c)}`).join("&");
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  };

  const heading =
    activeCategories.length === 1 ? activeCategories[0] : "Explore topics";

  /* ================= UI ================= */
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-20 pt-10 md:pt-14">
      <h1 className="text-center font-creato text-[32px] font-bold tracking-tight text-black md:text-[42px]">
        {heading}
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        {activeCategories.length
          ? `Stories about ${activeCategories.join(", ")}`
          : "Discover stories across every topic on Vichento"}
      </p>

      <div className="no-scrollbar -mx-4 mb-6 mt-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:justify-center md:px-0">
        <button
          onClick={() => router.replace("/explore", { scroll: false })}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
            activeCategories.length === 0
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const active = activeCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              aria-pressed={active}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                active ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 pt-6">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => <ShimmerArticle key={i} />)}

        {!loading && articles.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-creato text-lg font-bold text-black">No stories here yet.</p>
            <p className="mt-2 text-sm text-gray-500">
              Try another topic, or be the first to write about it.
            </p>
          </div>
        )}

        {!loading &&
          articles.map((article) => (
            <StoriesCardHorizontal
              key={article.id}
              article={article}
              isLiked={likes.has(article.id)}
              isBookmarked={bookmarks.has(article.id)}
              onLike={toggleLike}
              onBookmark={toggleBookmark}
            />
          ))}

        {!loading && hasMore && (
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
      </div>
    </div>
  );
}
