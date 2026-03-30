"use client";

import { useEffect, useRef, useState } from "react";
import { PiThumbsUp } from "react-icons/pi";
import { PiThumbsUpFill } from "react-icons/pi";
import { useParams } from "next/navigation";
import { databases, storage, ID } from "@/lib/appwrite";
import { Query, Permission, Role } from "appwrite";
import HTMLReactParser from "html-react-parser";
import { GoBookmark, GoBookmarkFill } from "react-icons/go";
import { IoBookmark, IoBookmarkOutline, IoBulbOutline } from "react-icons/io5";
import { IoIosShareAlt } from "react-icons/io";
import { IoArrowRedoOutline } from "react-icons/io5";

import { useAuthContext } from "@/context/AuthContext";
import RelatedArticles from "@/app/components/RelatedArticles";
import { PiSparkle, PiSparkleFill } from "react-icons/pi";

const DATABASE_ID = "693d3d220017a846a1c0";
const ARTICLES_COLLECTION = "articles";
const BUCKET_ID = "article-images";

export default function ReadArticlePage() {
  const { slug } = useParams();
  const { user } = useAuthContext();
  const readTimerRef = useRef(null);

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeDocId, setLikeDocId] = useState(null);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkDocId, setBookmarkDocId] = useState(null);

  const isAuthor = user?.$id === article?.authorId;

  const getAvatarUrl = (fileId) => {
    if (!fileId) return "/default-avatar.png";
    return storage.getFileView(BUCKET_ID, fileId).toString();
  };

  /* ---------------- FETCH ARTICLE ---------------- */
  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          ARTICLES_COLLECTION,
          [Query.equal("slug", [slug])]
        );

        if (!res.documents.length) return;

        const doc = res.documents[0];
        setArticle(doc);

        // ✅ FIX: fetch real likes count
        const likesRes = await databases.listDocuments(
          DATABASE_ID,
          "article_likes",
          [Query.equal("articleId", [doc.$id])]
        );

        setLikesCount(likesRes.total);

      } catch (err) {
        console.error("Fetch article failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  /* ---------------- VIEW COUNT (once/session) ---------------- */
  useEffect(() => {
    if (!article?.$id) return;

    const viewed = sessionStorage.getItem(`viewed_${article.$id}`);
    if (viewed) return;

    databases
      .updateDocument(DATABASE_ID, ARTICLES_COLLECTION, article.$id, {
        views: (article.views || 0) + 1,
      })
      .catch(console.error);

    sessionStorage.setItem(`viewed_${article.$id}`, "true");
  }, [article?.$id]);

  /* ---------------- READ COUNT (30s timer) ---------------- */
  useEffect(() => {
    if (!article?.$id) return;

    const read = sessionStorage.getItem(`read_${article.$id}`);
    if (read) return;

    readTimerRef.current = setTimeout(() => {
      databases
        .updateDocument(DATABASE_ID, ARTICLES_COLLECTION, article.$id, {
          reads: (article.reads || 0) + 1,
        })
        .catch(console.error);

      sessionStorage.setItem(`read_${article.$id}`, "true");
    }, 30000);

    return () => clearTimeout(readTimerRef.current);
  }, [article?.$id]);

  /* ---------------- LIKE & BOOKMARK STATUS ---------------- */
  useEffect(() => {
    if (!user || !article?.$id) return;

    const initStatus = async () => {
      try {
        const [likesRes, bookmarkRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, "article_likes", [
            Query.equal("articleId", [article.$id]),
            Query.equal("userId", [user.$id]),
          ]),
          databases.listDocuments(DATABASE_ID, "article_bookmarks", [
            Query.equal("articleId", [article.$id]),
            Query.equal("userId", [user.$id]),
          ]),
        ]);

        if (likesRes.documents.length) {
          setIsLiked(true);
          setLikeDocId(likesRes.documents[0].$id);
        }

        if (bookmarkRes.documents.length) {
          setIsBookmarked(true);
          setBookmarkDocId(bookmarkRes.documents[0].$id);
        }
      } catch (err) {
        console.error("Status check failed:", err);
      }
    };

    initStatus();
  }, [user, article?.$id]);

  /* ---------------- LIKE TOGGLE ---------------- */
  const toggleLike = async () => {
    if (!user) return alert("Please login to like");

    // optimistic update
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((v) => Math.max(v - 1, 0));
    } else {
      setIsLiked(true);
      setLikesCount((v) => v + 1);
    }

    try {
      if (isLiked) {
        await databases.deleteDocument(DATABASE_ID, "article_likes", likeDocId);
        setLikeDocId(null);
      } else {
        const doc = await databases.createDocument(
          DATABASE_ID,
          "article_likes",
          ID.unique(),
          { articleId: article.$id, userId: user.$id },
          [
            Permission.read(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        );
        setLikeDocId(doc.$id);
      }
    } catch (err) {
      console.error(err);
      // rollback if needed (optional)
    }
  };

  /* ---------------- BOOKMARK TOGGLE ---------------- */
  const toggleBookmark = async () => {
    if (!user) return alert("Please login to bookmark");

    setIsBookmarked((v) => !v); // instant UI

    try {
      if (isBookmarked) {
        await databases.deleteDocument(
          DATABASE_ID,
          "article_bookmarks",
          bookmarkDocId,
        );
        setBookmarkDocId(null);
      } else {
        const doc = await databases.createDocument(
          DATABASE_ID,
          "article_bookmarks",
          ID.unique(),
          { articleId: article.$id, userId: user.$id },
          [
            Permission.read(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        );
        setBookmarkDocId(doc.$id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- SHARE ---------------- */

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  };

  /* ---------------- RENDER ---------------- */
  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto p-4 animate-pulse">

        {/* Title */}
        <div className="h-8 bg-gray-300 rounded w-3/4 mt-6"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2 mt-2"></div>

        {/* Description */}
        <div className="h-4 bg-gray-300 rounded w-full mt-6"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6 mt-2"></div>

        {/* Author */}
        <div className="flex items-center gap-3 mt-8">
          <div className="w-6 h-6 rounded-full bg-gray-300"></div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>

        {/* Image */}
        <div className="w-full h-[200px] bg-gray-300 rounded mt-8"></div>

        {/* Content lines */}
        <div className="mt-8 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-11/12"></div>
          <div className="h-4 bg-gray-300 rounded w-10/12"></div>
          <div className="h-4 bg-gray-300 rounded w-9/12"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }
  if (!article) return <p className="text-center mt-20">Article not found</p>;

  const imageUrl = article.featuredImage
    ? storage.getFileView(BUCKET_ID, article.featuredImage).toString()
    : null;

  return (
    <div className="max-w-[800px] p-4 md:p-0 mx-auto pt-2">
      {/* <div className="bg-gray-200 w-full h-[120px] mt-10 rounded-sm flex items-center justify-center">
        <p className="text-gray-500">Advertisment Area</p>
      </div> */}

      <h1 className=" text-2xl font-semibold  md:text-[34px] text-black dark:text-white font-creato tracking-tight md:pt-18 pt-8 leading-tight">
        {article.title}
      </h1>
      {/* short description optional */}
      <p className="text-lg md:text-xl tracking-wide font-creato mt-5 text-black/60">
        {article.shortDescription || null}

      </p>

      {/* AUTHOR SECTION */}
      <div className="w-full flex my-4 justify-between ">
        <div className="text-gray-500 text-sm md:text-lg flex gap-2 md:gap-4 items-center">
          <img
            src={
              isAuthor && user?.prefs?.avatar
                ? getAvatarUrl(user.prefs.avatar)
                : getAvatarUrl(article.authorAvatar)
            }
            className="w-6 h-6 rounded-full object-cover"
            alt="Author"
          />

          <p>{isAuthor ? user.name : article.authorName || "Admin"}</p>

          <p>{new Date(article.$createdAt).toDateString()}</p>
          {/* <p>{article.readTime} min read</p> */}
        </div>
        <div className="flex items-center gap-3">


          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLike(article.$id)} // later rename to onSpark
              className="cursor-pointer transition-transform active:scale-95"
              title="Spark this post"
            >
              {isLiked ? (
                <PiThumbsUpFill size={20} className="text-black" />
              ) : (
                <PiThumbsUp
                  size={20}
                  className="text-gray-500 hover:text-black transition-colors"
                />
              )}
            </button>
            <span className="text-sm text-gray-500">{likesCount}</span>
          </div>
          <button className="cursor-pointer" onClick={toggleBookmark}>
            {isBookmarked ? (
              <IoBookmark size={18} className="text-black" />
            ) : (
              <IoBookmarkOutline
                size={18}
                className="text-gray-500 hover:text-black"
              />
            )}
          </button>
          <button
            onClick={handleShare}
            className="h-8 w-8 rounded-full cursor-pointer flex items-center justify-center transition"
          >
            <IoArrowRedoOutline className="text-gray-500" size={18} />
          </button>
        </div>
      </div>


      {imageUrl && (
        <img
          src={imageUrl}
          className="w-full h-full my-1 rounded object-cover"
          alt={article.title}
        />
      )}

      <div className="prose font-serif prose-lg text-black dark:text-white max-w-none text-[18px] md:text-[22px]">
        {HTMLReactParser(article.content)}
      </div>





      <div className="w-full py-10">
        <hr className="my-6 opacity-10" />
        <p className="text-[22px] text-black dark:text-white font-semibold tracking-tighter">
          Related Stories
        </p>
        <RelatedArticles
          categories={article.categories}
          currentId={article.$id}
        />
      </div>
    </div>
  );
}
