"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import useArticleActions from "@/hooks/useArticleActions";
import ShimmerArticle from "../components/ShimmerArticle";
import YourReadingLIst from "../components/YourReadingLIst";
import StoriesCardHorizontal from "../components/StoriesCardHorizontal";
import ForYou from "../components/ForYou";
import RecomendedTopics from "../components/RecomendedTopics";

export default function Homepage() {
  const { user } = useAuthContext();

  // ✅ FIX: use Supabase user.id
  const { likes, bookmarks, toggleLike, toggleBookmark, version } =
    useArticleActions(user?.id);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("explore");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // ✅ Fetch articles + author (users table)
        const { data, error } = await supabase
          .from("articles")
          .select(`
          *,
          users (
            id,
            name,
            avatar
          )
        `)
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        // ✅ Transform data for UI (VERY IMPORTANT)
        const formatted = (data || []).map((article) => ({
          ...article,
          author_name: article.users?.name || "Unknown",
          author_avatar: article.users?.avatar
            ? getImageUrl(article.users.avatar)
            : null,
        }));

        setArticles(formatted);

      } catch (err) {
        console.error("Homepage fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log("Fetched articles:", articles);

 const getImageUrl = (path) => {
  if (!path) return null;

  // ✅ If already full URL → return as is
  if (path.startsWith("http")) return path;

  // ✅ Else generate from Supabase
  const { data } = supabase.storage
    .from("article-images")
    .getPublicUrl(path);

  return data.publicUrl;
};


  /* ================= UI ================= */
  return (
    <div className="w-full">
      <div className="w-full max-w-[1200px] mx-auto px-4 flex gap-10">

        {/* ================= LEFT FEED ================= */}
        <div className="flex-1 pt-4">

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8 flex gap-8">
            {["for-you", "explore"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm ${activeTab === tab
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500"
                  }`}
              >
                {tab === "explore" ? "Explore" : "For You"}
              </button>
            ))}
          </div>

          {/* ================= EXPLORE TAB ================= */}
          {activeTab === "explore" && (
            <>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <ShimmerArticle key={i} />
                ))}

              {!loading &&
                articles.map((article) => (
                  <StoriesCardHorizontal
                    key={article.id} // ✅ FIX
                    article={{
                      ...article,
                      thumbnail: (article.cover_image),
                      author_avatar: article.author_avatar // ✅ FIX
                    }}
                    isLiked={likes.has(article.id)}
                    isBookmarked={bookmarks.has(article.id)}
                    onLike={toggleLike}
                    onBookmark={toggleBookmark}
                  />
                ))}
            </>
          )}

          {/* ================= FOR YOU ================= */}
          {activeTab === "for-you" && (
            <ForYou
              user={user}
              likes={likes}
              bookmarks={bookmarks}
              onLike={toggleLike}
              onBookmark={toggleBookmark}
            />
          )}
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="hidden lg:block w-[320px] pt-6 border-l border-gray-200 pl-6">
          <div className="sticky top-[80px]">
            <YourReadingLIst refreshKey={version} />
            <br />
            <br />
            <RecomendedTopics />
          </div>
        </div>

      </div>
    </div>
  );
}