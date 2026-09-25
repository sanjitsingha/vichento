"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AiFillLike, AiOutlineLike } from "react-icons/ai";
import { TbBookmarks, TbBookmarksFilled } from "react-icons/tb";
import { RxShare2 } from "react-icons/rx";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  formatDate,
  getExcerpt,
  getImageUrl,
  readingTime,
  shareLink,
} from "@/lib/articleUtils";
import Avatar from "./ui/Avatar";

function StoriesCardHorizontal({
  article,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
}) {
  const { user } = useAuthContext();
  const router = useRouter();
  const toast = useToast();

  const imageUrl = article.thumbnail || getImageUrl(article.cover_image);
  const authorHref = `/profile/${article.author_username || article.author_id}`;
  const isOwn = user?.id && user.id === article.author_id;
  const firstTopic = article.categories?.[0];

  const requireUser = () => {
    if (user) return true;
    router.push("/signin");
    return false;
  };

  const handleLike = async () => {
    if (!requireUser() || !onLike) return;
    const ok = await onLike(article.id);
    if (ok === false) toast("Couldn't update like", "error");
  };

  const handleBookmark = async () => {
    if (!requireUser() || !onBookmark) return;
    const ok = await onBookmark(article.id);
    if (ok === false) toast("Couldn't update your list", "error");
    else if (ok) toast(isBookmarked ? "Removed from your list" : "Saved to your list");
  };

  const handleShare = async () => {
    const result = await shareLink({
      title: article.title,
      url: `${window.location.origin}/read/${article.slug}`,
    });
    if (result === "copied") toast("Link copied");
  };

  return (
    <article className="group/card border-b border-gray-100 py-8 first:pt-2">
      {/* ================= AUTHOR ================= */}
      <div className="flex items-center gap-2 text-[13px] text-gray-600">
        <Link href={authorHref} className="flex items-center gap-2 hover:text-black">
          <Avatar src={article.author_avatar} name={article.author_name} size={22} />
          <span className="font-medium">
            {isOwn ? "You" : article.author_name}
          </span>
        </Link>
        {firstTopic && (
          <>
            <span className="text-gray-400">in</span>
            <Link
              href={`/explore?category=${encodeURIComponent(firstTopic)}`}
              className="font-medium hover:text-black"
            >
              {firstTopic}
            </Link>
          </>
        )}
      </div>

      {/* ================= CONTENT ================= */}
      <Link href={`/read/${article.slug}`} className="mt-3 flex gap-6 sm:gap-10">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-3 font-creato text-[18px] font-bold leading-snug tracking-tight text-black sm:line-clamp-2 md:text-[22px]">
            {article.title}
          </h2>
          <div className="hidden sm:block">
            <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-gray-500">
              {getExcerpt(article)}
            </p>
          </div>
        </div>

        {imageUrl && (
          <div className="relative h-[56px] w-[80px] shrink-0 overflow-hidden rounded-sm bg-gray-100 sm:h-[107px] sm:w-[160px]">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(min-width: 640px) 160px, 80px"
              className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
            />
          </div>
        )}
      </Link>

      {/* ================= META + ACTIONS ================= */}
      <div className="mt-4 flex items-center justify-between text-[13px] text-gray-500">
        <div className="flex items-center gap-2">
          <span>{formatDate(article.published_at || article.updated_at || article.created_at)}</span>
          <span aria-hidden>·</span>
          <span>{readingTime(article.content)} min read</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            aria-label={isLiked ? "Unlike" : "Like"}
            aria-pressed={!!isLiked}
            title="Like"
            className="transition-transform active:scale-90"
          >
            {isLiked ? (
              <AiFillLike size={19} className="text-black" />
            ) : (
              <AiOutlineLike size={19} className="transition-colors hover:text-black" />
            )}
          </button>

          <button
            onClick={handleBookmark}
            aria-label={isBookmarked ? "Remove from list" : "Save to list"}
            aria-pressed={!!isBookmarked}
            title="Save"
            className="transition-transform active:scale-90"
          >
            {isBookmarked ? (
              <TbBookmarksFilled size={19} className="text-black" />
            ) : (
              <TbBookmarks size={19} className="transition-colors hover:text-black" />
            )}
          </button>

          <button
            onClick={handleShare}
            aria-label="Share"
            title="Share"
            className="transition-transform active:scale-90"
          >
            <RxShare2 size={17} className="transition-colors hover:text-black" />
          </button>
        </div>
      </div>
    </article>
  );
}
export default React.memo(StoriesCardHorizontal);
