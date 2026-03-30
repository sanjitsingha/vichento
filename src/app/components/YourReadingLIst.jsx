"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuthContext } from "@/context/AuthContext";
import Image from "next/image";

const DATABASE_ID = "693d3d220017a846a1c0";
const BOOKMARKS_COLLECTION = "article_bookmarks";
const ARTICLES_COLLECTION = "articles";
const BUCKET_ID = "article-images";

const YourReadingLIst = ({ refreshKey }) => {
  const { user } = useAuthContext();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Strong cache-busting (important)
const getAvatarUrl = (fileId) => {
  if (!fileId) return "/default-avatar.png";
  const url = new URL(storage.getFileView(BUCKET_ID, fileId).toString());
  url.searchParams.set("v", Date.now());
  return url.toString();
};

  useEffect(() => {
    if (!user?.$id) return;

    const fetchBookmarks = async () => {
      try {
        const bookmarksRes = await databases.listDocuments(
          DATABASE_ID,
          BOOKMARKS_COLLECTION,
          [Query.equal("userId", [user.$id])]
        );

        if (bookmarksRes.documents.length === 0) {
          setArticles([]);
          setLoading(false);
          return;
        }

        const articleIds = bookmarksRes.documents.map(
          (doc) => doc.articleId
        );

        const articlesRes = await databases.listDocuments(
          DATABASE_ID,
          ARTICLES_COLLECTION,
          [
            Query.equal("$id", articleIds),
            Query.equal("status", ["published"]),
            Query.orderDesc("$updatedAt"),
          ]
        );

        setArticles(articlesRes.documents.slice(0, 3));
      } catch (error) {
        console.error("Bookmark fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user?.$id, refreshKey]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading bookmarks…</p>;
  }

  if (articles.length === 0) {
    return <p className="text-sm text-gray-500">No bookmarks yet.</p>;
  }

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.slice(0, maxLength) + "…"
      : text;
  };

  return (
    <div className="w-full">
      <p className="font-semibold mb-4">Your Reading List</p>

      <div className="flex flex-col gap-6">
        {articles.map((article) => {
          const imageUrl = article.featuredImage
            ? storage
                .getFileView(BUCKET_ID, article.featuredImage)
                .toString()
            : null;

          // ✅ FINAL AVATAR LOGIC
          let avatarUrl;

          if (user?.$id === article.authorId && user?.prefs?.avatar) {
            // your own article → always latest
            avatarUrl = getAvatarUrl(user.prefs.avatar);
          } else {
            // others → fallback + force refresh
            avatarUrl = getAvatarUrl(article.authorAvatar);
          }

          return (
            <Link
              key={article.$id}
              href={`/read/${article.slug}`}
              className="flex gap-12 items-center"
            >
              <div className="flex-1">
                <div className="w-full flex gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <img src={avatarUrl} alt="" />
                  </div>

                  <p className="text-sm text-gray-500">
                    {user?.$id === article.authorId
                      ? user.name
                      : article.authorName}
                  </p>
                </div>

                <p className="text-[14px] mt-2 font-medium">
                  {truncateText(article.title, 30)}
                </p>
              </div>

              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={article.title}
                  width={80}
                  height={80}
                  className="rounded object-cover"
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="w-full mt-6 border-t border-gray-300/80 pt-3">
        <Link
          href="/library"
          className="text-sm text-green-600 hover:underline block text-center"
        >
          See all
        </Link>
      </div>
    </div>
  );
};

export default YourReadingLIst;