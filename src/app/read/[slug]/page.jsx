"use client";

import { useEffect, useRef, useState } from "react";
import { PiThumbsUp, PiThumbsUpFill } from "react-icons/pi";
import { useParams } from "next/navigation";
import HTMLReactParser from "html-react-parser";
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { IoArrowRedoOutline } from "react-icons/io5";
import { useAuthContext } from "@/context/AuthContext";
import RelatedArticles from "@/app/components/RelatedArticles";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";


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

  const isAuthor = user?.id === article?.author_id;

  /* ---------------- FETCH ARTICLE ---------------- */
  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;

        setArticle(data);

        // likes count
        const { count } = await supabase
          .from("article_likes")
          .select("*", { count: "exact", head: true })
          .eq("article_id", data.id);

        setLikesCount(count || 0);
      } catch (err) {
        console.error("Fetch article failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  /* ---------------- VIEW TRACKING ---------------- */
  useEffect(() => {
    if (!article?.id) return;

    const viewed = sessionStorage.getItem(`viewed_${article.id}`);
    if (viewed) return;

    const addView = async () => {
      await supabase.from("article_views").insert([
        {
          article_id: article.id,
          user_id: user?.id || null,
        },
      ]);

      // optional count update
      await supabase
        .from("articles")
        .update({
          view_count: (article.view_count || 0) + 1,
        })
        .eq("id", article.id);
    };

    addView();
    sessionStorage.setItem(`viewed_${article.id}`, "true");
  }, [article?.id]);

  /* ---------------- LIKE STATUS ---------------- */
  useEffect(() => {
    if (!user || !article?.id) return;

    const checkLike = async () => {
      const { data } = await supabase
        .from("article_likes")
        .select("*")
        .eq("article_id", article.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setIsLiked(true);
        setLikeDocId(data.id);
      }
    };

    checkLike();
  }, [user, article?.id]);

  /* ---------------- BOOKMARK STATUS ---------------- */
  useEffect(() => {
    if (!user || !article?.id) return;

    const checkBookmark = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("article_id", article.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setIsBookmarked(true);
        setBookmarkDocId(data.id);
      }
    };

    checkBookmark();
  }, [user, article?.id]);

  /* ---------------- LIKE TOGGLE ---------------- */
  const toggleLike = async () => {
    if (!user) return alert("Please login to like");

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((v) => Math.max(v - 1, 0));

      await supabase.from("article_likes").delete().eq("id", likeDocId);
      setLikeDocId(null);
    } else {
      setIsLiked(true);
      setLikesCount((v) => v + 1);

      const { data } = await supabase
        .from("article_likes")
        .insert([
          {
            article_id: article.id,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      setLikeDocId(data.id);
    }
  };

  /* ---------------- BOOKMARK TOGGLE ---------------- */
  const toggleBookmark = async () => {
    if (!user) return alert("Please login to bookmark");

    if (isBookmarked) {
      setIsBookmarked(false);

      await supabase.from("bookmarks").delete().eq("id", bookmarkDocId);
      setBookmarkDocId(null);
    } else {
      setIsBookmarked(true);

      const { data } = await supabase
        .from("bookmarks")
        .insert([
          {
            article_id: article.id,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      setBookmarkDocId(data.id);
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

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  if (!article)
    return (
      <div>
        <p className="text-center text-black font-bold text-3xl mt-20">
          Article not found
        </p>
        <Link
          href="/explore"
          className="text-gray-600 mx-auto w-fit mt-3 block hover:underline"
        >
          Back to Explore
        </Link>
      </div>
    );

  const imageUrl = article.cover_image || null;

  return (
    <div className="max-w-[800px] p-4 md:p-0 mx-auto pt-2">
      <h1 className="text-2xl md:text-[34px] font-creato font-semibold text-black mt-8">
        {article.title}
      </h1>

      <p className="text-lg font-creato mt-5 text-black/60">
        {article.meta_description}
      </p>

      {/* AUTHOR */}
      <div className="flex justify-between my-4">
        <div className="text-gray-500 text-sm flex gap-3 items-center">
          <p>{isAuthor ? user?.user_metadata?.name : "Author"}</p>
          <p>{new Date(article.created_at).toDateString()}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* LIKE */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLike}>
              {isLiked ? (
                <PiThumbsUpFill size={20} />
              ) : (
                <PiThumbsUp size={20} />
              )}
            </button>
            <span className="text-sm">{likesCount}</span>
          </div>

          {/* BOOKMARK */}
          <button onClick={toggleBookmark}>
            {isBookmarked ? (
              <IoBookmark size={18} />
            ) : (
              <IoBookmarkOutline size={18} />
            )}
          </button>

          {/* SHARE */}
          <button onClick={handleShare}>
            <IoArrowRedoOutline size={18} />
          </button>
        </div>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          className="w-full rounded my-4"
          alt={article.title}
        />
      )}

      <div className="prose max-w-none  text-black">
        {HTMLReactParser(article.content)}
      </div>

      {/* RELATED */}
      <div className="py-10">
        <hr className="my-6" />
        <p className="text-xl font-semibold">Related Stories</p>

        <RelatedArticles
          categories={article.categories}
          currentId={article.id}
        />
      </div>
    </div>
  );
}