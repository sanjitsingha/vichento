"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HTMLReactParser from "html-react-parser";
import { IoArrowRedoOutline, IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { useAuthContext } from "@/context/AuthContext";
import RelatedArticles from "@/app/components/RelatedArticles";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useUserActions from "@/hooks/useUserActions";
import { PiThumbsUp, PiThumbsUpFill } from "react-icons/pi";


export default function ReadArticlePage() {
  const { slug } = useParams();
  const { user } = useAuthContext();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const { likes, bookmarks, toggleLike, toggleBookmark } =
    useUserActions(user);
  const isLiked = likes.has(article?.id);
  const isBookmarked = bookmarks.has(article?.id);

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
      } catch (err) {
        console.error("Fetch article failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  /* ================= VIEW TRACKING (OPTIMIZED) ================= */
  useEffect(() => {
    if (!article?.id) return;

    const trackView = async () => {
      const storageKey = `viewed_${article.id}`;

      // ✅ prevent duplicate (guest + session)
      const alreadyViewed = localStorage.getItem(storageKey);
      if (alreadyViewed) return;

      // ✅ mark instantly (optimistic)
      localStorage.setItem(storageKey, "true");

      const { error } = await supabase.from("views").insert([
        {
          article_id: article.id,
          user_id: user?.id || null,
        },
      ]);

      // ignore duplicate error
      if (error && error.code !== "23505") {
        console.error("VIEW ERROR:", error);
      }
    };

    trackView();
  }, [article?.id]);

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
        <div className="text-gray-500 text-sm flex gap-3  items-center">
          <p>{isAuthor ? user?.user_metadata?.name : "Author"}</p>
          <p>{new Date(article.created_at).toDateString()}</p>
        </div>

        {/* ONLY SHARE LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike(article.id)}
            className="cursor-pointer transition-transform active:scale-95"
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
          <button
            onClick={() => toggleBookmark(article.id)}
            className="cursor-pointer transition-transform active:scale-95"
          >
            {isBookmarked ? (
              <IoBookmark size={18} className="text-black" />
            ) : (
              <IoBookmarkOutline
                size={18}
                className="text-gray-500 hover:text-black transition-colors"
              />
            )}
          </button>

          <button onClick={handleShare}>
            <IoArrowRedoOutline color="black" size={18} />
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

      <div className="prose max-w-none text-black">
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