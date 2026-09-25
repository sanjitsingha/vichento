"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { IoSearchOutline } from "react-icons/io5";
import { supabase } from "@/lib/supabaseClient";
import StoriesCardHorizontal from "@/app/components/StoriesCardHorizontal";
import ShimmerArticle from "@/app/components/ShimmerArticle";
import useUserActions from "@/hooks/useUserActions";
import { useAuthContext } from "@/context/AuthContext";
import { toCardArticle } from "@/lib/articleUtils";
import { CATEGORIES } from "@/lib/constants";

// Escape characters that have meaning inside a PostgREST `or()` filter.
const escapeFilter = (s) => s.replace(/[%_,()*\\]/g, " ").trim();

const Page = () => {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = (searchParams.get("q") || "").trim();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  const { likes, bookmarks, toggleLike, toggleBookmark } = useUserActions(user);

  const matchingTopics = query
    ? CATEGORIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    // With no query the results area isn't rendered, so nothing to reset.
    if (!query) return;
    let cancelled = false;

    const fetchSearchResults = async () => {
      setLoading(true);
      const term = escapeFilter(query);

      const { data, error } = await supabase
        .from("articles")
        .select(
          `*,
            users(
              id,
              name,
              username,
              avatar
            )`,
        )
        .eq("status", "published")
        .or(`title.ilike.%${term}%,meta_description.ilike.%${term}%`)
        .order("updated_at", { ascending: false })
        .limit(30);

      if (cancelled) return;
      if (error) console.error("Search fetch error:", error);
      setArticles((data || []).map(toCardArticle));
      setLoading(false);
    };

    fetchSearchResults();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="w-full px-4 pb-20">
      <div className="mx-auto max-w-[720px]">
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="mt-8 flex items-center gap-3 rounded-full bg-gray-100 px-4 py-2.5 focus-within:bg-gray-200/70 md:mt-12"
        >
          <IoSearchOutline size={20} className="text-gray-500" />
          <input
            type="search"
            placeholder="Search stories"
            aria-label="Search stories"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-transparent text-base text-black outline-none placeholder:text-gray-500 md:text-sm"
            autoFocus={!query}
          />
        </form>

        {!query ? (
          <div className="mt-12">
            <p className="mb-4 font-creato font-bold text-black">Browse topics</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/explore?category=${encodeURIComponent(c)}`}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            <h1 className="mt-10 font-creato text-[28px] text-black/50 md:text-[40px]">
              Results for <span className="text-black">{query}</span>
            </h1>

            {matchingTopics.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {matchingTopics.map((c) => (
                  <Link
                    key={c}
                    href={`/explore?category=${encodeURIComponent(c)}`}
                    className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:border-black"
                  >
                    Topic: {c}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-gray-100 pt-4">
              {loading &&
                Array.from({ length: 3 }).map((_, i) => <ShimmerArticle key={i} />)}

              {!loading && articles.length === 0 && (
                <div className="py-16 text-center">
                  <p className="font-creato text-lg font-bold text-black">
                    No stories found for &quot;{query}&quot;
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Make sure all words are spelled correctly, or try a broader search.
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Page;
