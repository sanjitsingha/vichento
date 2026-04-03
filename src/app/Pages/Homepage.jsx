"use client";

import React, { useEffect, useState, version } from "react";
import Link from "next/link";
import { databases, storage, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuthContext } from "@/context/AuthContext";
import { RiFireLine, RiFireFill } from "react-icons/ri";

import { IoIosShareAlt } from "react-icons/io";
import useArticleActions from "@/hooks/useArticleActions";

import ShimmerArticle from "../components/ShimmerArticle";
import YourReadingLIst from "../components/YourReadingLIst";
import StoriesCardHorizontal from "../components/StoriesCardHorizontal";
import ForYou from "../components/ForYou";
import RecomendedTopics from "../components/RecomendedTopics";

const DB_ID = "693d3d220017a846a1c0";
const ARTICLES_COLLECTION = "articles";
const LIKES_COLLECTION = "article_likes";
const BOOKMARKS_COLLECTION = "article_bookmarks";
const BUCKET_ID = "article-images";

export default function Homepage() {
  const { user } = useAuthContext();
  const { likes, bookmarks, toggleLike, toggleBookmark, version } =
    useArticleActions(user?.$id);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("explore");

  const [userLikes, setUserLikes] = useState(new Set());
  const [userBookmarks, setUserBookmarks] = useState(new Set());

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Fetch published articles
        const articlesRes = await databases.listDocuments(
          DB_ID,
          ARTICLES_COLLECTION,
          [
            Query.equal("status", ["published"]),
            Query.orderDesc("$updatedAt"),
            Query.limit(10),
          ]
        );

        setArticles(articlesRes.documents);

        // 2️⃣ Fetch likes & bookmarks (if logged in)
        if (user?.$id) {
          const likesRes = await databases.listDocuments(
            DB_ID,
            LIKES_COLLECTION,
            [Query.equal("userId", [user.$id])]
          );

          const bookmarksRes = await databases.listDocuments(
            DB_ID,
            BOOKMARKS_COLLECTION,
            [Query.equal("userId", [user.$id])]
          );

          setUserLikes(new Set(likesRes.documents.map((l) => l.articleId)));
          setUserBookmarks(
            new Set(bookmarksRes.documents.map((b) => b.articleId))
          );
        }
      } catch (err) {
        console.error("Homepage fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.$id]);

  /* ================= HELPERS ================= */
  const getImageUrl = (fileId) =>
    fileId ? storage.getFileView(BUCKET_ID, fileId).toString() : null;

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
                className={`pb-2 text-sm ${
                  activeTab === tab
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500"
                }`}
              >
                {tab === "explore" ? "Explore" : "For You"}
              </button>
            ))}
          </div>

          {/* Loading */}
          {/* ================= FEED ================= */}
          {activeTab === "explore" && (
            <>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <ShimmerArticle key={i} />
                ))}

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
            </>
          )}

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
            <RecomendedTopics/>
          </div>
          
        </div>
      </div>
    </div>
  );
}
