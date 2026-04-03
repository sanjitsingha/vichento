"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuthContext } from "@/context/AuthContext";
import useArticleActions from "@/hooks/useArticleActions";
import ShimmerArticle from "@/app/components/ShimmerArticle";
import StoriesCardHorizontal from "@/app/components/StoriesCardHorizontal";

const DB_ID = "693d3d220017a846a1c0";
const ARTICLES_COLLECTION = "articles";

const CATEGORIES = [
  "Technology",
  "Startups",
  "Design",
  "Ai",
  "Health",
  "Productivity",
  "Business",
];

export default function Page() {
  const searchParams = useSearchParams();

  const { user } = useAuthContext();
  const { likes, bookmarks, toggleLike, toggleBookmark } =
    useArticleActions(user?.$id);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState([]);
  const [isReady, setIsReady] = useState(false); // 👈 important

  /* ================= READ FROM URL ================= */
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");

    if (categoryFromUrl) {
      setActiveCategories([categoryFromUrl]);
    }

    setIsReady(true); // 👈 allow fetch after this
  }, [searchParams]);

  /* ================= FETCH ARTICLES ================= */
  useEffect(() => {
    if (!isReady) return; // 👈 prevent early fetch

    const fetchArticles = async () => {
      setLoading(true);

      try {
        let queries = [
          Query.equal("status", ["published"]),
          Query.orderDesc("$updatedAt"),
          Query.limit(20),
        ];

        if (activeCategories.length === 1) {
          queries.push(Query.contains("categories", activeCategories[0]));
        }

        if (activeCategories.length > 1) {
          queries.push(Query.contains("categories", activeCategories));
        }

        const res = await databases.listDocuments(
          DB_ID,
          ARTICLES_COLLECTION,
          queries
        );

        setArticles(res.documents);
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [activeCategories, isReady]);

  /* ================= CATEGORY TOGGLE ================= */
  const toggleCategory = (category) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  /* ================= UI ================= */
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 pt-6">
      <h1 className="text-[22px] font-semibold mb-6">Explore</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        {CATEGORIES.map((cat) => {
          const active = activeCategories.includes(cat);

          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-300 hover:border-black"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {loading &&
        Array.from({ length: 5 }).map((_, i) => (
          <ShimmerArticle key={i} />
        ))}

      {!loading && articles.length === 0 && (
        <p className="text-sm text-gray-500">
          No stories found for selected categories.
        </p>
      )}

      {!loading &&
        articles.map((article) => (
          <StoriesCardHorizontal
            key={article.$id}
            article={article}
            isLiked={likes.has(article.$id)}
            isBookmarked={bookmarks.has(article.$id)}
            onLike={toggleLike}
            onBookmark={toggleBookmark}
          />
        ))}
    </div>
  );
}