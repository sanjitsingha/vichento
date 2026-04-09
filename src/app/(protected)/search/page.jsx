"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import StoriesCardHorizontal from "@/app/components/StoriesCardHorizontal";
import useArticleActions from "@/hooks/useArticleActions";
import { useAuthContext } from "@/context/AuthContext";
import { IoSearchOutline } from "react-icons/io5";

const Page = () => {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const showSearchUI = query.trim() === "";

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  const { likes, bookmarks, toggleLike, toggleBookmark } =
    useArticleActions(user?.id);

  useEffect(() => {
    if (showSearchUI) {
      setArticles([]);
      setLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("articles")
          .select(`*,
            users(
              id,
              name,
              avatar
          )
            `)
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        const filtered = data.filter((article) =>
          article.title?.toLowerCase().includes(query.toLowerCase())
        );

        setArticles(filtered);
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, showSearchUI]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  };


  console.log("Search results:", articles);
  return (
    <div className="w-full px-4 md:px-0">
      <div className="max-w-[800px] mx-auto">
        {/* Heading */}
        {!showSearchUI && (
          <div className="mt-6">
            <p className="text-[26px] md:text-[32px] tracking-tight font-semibold">
              Search results for{" "}
              <span className="text-gray-600">"{query}"</span>
            </p>
          </div>
        )}

        {/* SEARCH BAR (shown when query is empty – mobile first) */}
        {showSearchUI && (
          <div className="mt-12">
            <p className="text-sm text-gray-500 mb-3">
              Search stories, ideas, or topics
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="
                flex items-center gap-3
                border border-gray-300
                rounded-md
                px-3 py-3
                md:py-2
              "
            >
              <input
                type="text"
                placeholder="Search stories…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="
                  flex-1
                  outline-none
                  text-base md:text-sm
                "
                autoFocus
              />
              <button
                type="submit"
                className="text-gray-500 hover:text-black"
                aria-label="Search"
              >
                <IoSearchOutline size={20} />
              </button>
            </form>
          </div>
        )}

        {/* RESULTS */}
        {!showSearchUI && (
          <div className="mt-10">
            {loading && (
              <p className="text-sm text-gray-500">Searching stories…</p>
            )}

            {!loading && articles.length === 0 && (
              <p className="text-sm text-gray-500">
                No stories found for "{query}"
              </p>
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
        )}
      </div>
    </div>
  );
};

export default Page;