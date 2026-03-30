"use client";

import React, { useEffect, useState } from "react";
import { Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import { useAuthContext } from "@/context/AuthContext";
import StoriesCardHorizontal from "@/app/components/StoriesCardHorizontal";
import useArticleActions from "@/hooks/useArticleActions";
import ShimmerArticle from "@/app/components/ShimmerArticle";
import { IoBookmark } from "react-icons/io5";

const DATABASE_ID = "693d3d220017a846a1c0";
const BOOKMARKS_COLLECTION = "article_bookmarks";
const ARTICLES_COLLECTION = "articles";

const Page = () => {
  const { user } = useAuthContext(); // ✅ FIXED
  const { likes, bookmarks, toggleLike, toggleBookmark, version } =
    useArticleActions(user?.$id);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.$id) {
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      setLoading(true);

      try {
        // 1️⃣ Fetch bookmark docs
        const bookmarksRes = await databases.listDocuments(
          DATABASE_ID,
          BOOKMARKS_COLLECTION,
          [Query.equal("userId", [user.$id])]
        );

        if (bookmarksRes.documents.length === 0) {
          setArticles([]);
          return;
        }

        const articleIds = bookmarksRes.documents.map((b) => b.articleId);

        // 2️⃣ Fetch bookmarked articles
        const articlesRes = await databases.listDocuments(
          DATABASE_ID,
          ARTICLES_COLLECTION,
          [
            Query.equal("$id", articleIds),
            Query.equal("status", ["published"]),
            Query.orderDesc("$updatedAt"),
          ]
        );

        setArticles(articlesRes.documents);
      } catch (err) {
        console.error("Library fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user?.$id, version]); // ✅ reacts to bookmark add/remove

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto pt-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerArticle key={i} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center mt-20">
        No bookmarks yet.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-[800px] mx-auto pt-10">
        <div className="w-full flex justify-between items-center pb-3 border-b border-gray-300 mb-6">
          <p className="text-[24px] tracking-tight text-black font-creato">Reading List</p>
          <IoBookmark className="text-gray-500" size={22}/>
        </div>

        {articles.map((article) => (
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
    </div>
  );
};

export default Page;
