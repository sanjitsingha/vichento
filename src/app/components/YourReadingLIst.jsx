import Link from "next/link";
import React, { useEffect, useState } from "react";
import { IoBookmarkOutline } from "react-icons/io5";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuthContext } from "@/context/AuthContext";
import Image from "next/image";

const DATABASE_ID = "693d3d220017a846a1c0";
const BOOKMARKS_COLLECTION = "article_bookmarks";
const ARTICLES_COLLECTION = "articles";

const YourReadingLIst = ({refreshKey}) => {
  const { user } = useAuthContext();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // console.log(user)

  useEffect(() => {
    if (!user?.$id) return;

    const fetchBookmarks = async () => {
      try {
        // 1️⃣ Fetch bookmarks
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

        const articleIds = bookmarksRes.documents.map((doc) => doc.articleId);
        // console.log(articleIds) // IM GETTING RESPONSE

        // 2️⃣ Fetch articles
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
  console.log(articles);

  const getAvatarUrl = (fileId) => {
    if (!fileId) return "/default-avatar.png";
    return storage.getFileView("article-images", fileId);
  };

  return (
    <div className="w-full">
      <p className="font-semibold mb-4">Your Reading List</p>

      <div className="flex flex-col gap-6">
        {articles.map((article) => {
          const imageUrl = article.featuredImage
            ? storage
                .getFileView("article-images", article.featuredImage)
                .toString()
            : null;

          return (
            <Link
              key={article.$id}
              href={`/read/${article.slug}`}
              className="flex gap-12 items-center"
            >
              <div className="flex-1">
                <div className="w-full flex gap-2 ">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <img src={getAvatarUrl(article.authorAvatar)} />
                  </div>
                  <p className="text-sm text-gray-500">{article.authorName}</p>
                </div>
                <p className="text-[14px] mt-2 font-medium"> {truncateText(article.title, 30)}</p>
                {/* <p className="text-[10px] text-gray-500 mt-1">
                  {new Date(article.$createdAt).toDateString()}
                </p> */}
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
