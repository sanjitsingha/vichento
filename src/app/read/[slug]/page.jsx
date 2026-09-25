"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HTMLReactParser from "html-react-parser";
import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";
import { AiFillLike, AiOutlineLike } from "react-icons/ai";
import { RxShare2 } from "react-icons/rx";
import { TbBookmarks, TbBookmarksFilled } from "react-icons/tb";
import { FaRegComment } from "react-icons/fa6";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabaseClient";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { buildAnalyticsPayload } from "@/lib/analyticsHelpers";
import { formatDate, getImageUrl, readingTime, shareLink } from "@/lib/articleUtils";
import useUserActions from "@/hooks/useUserActions";
import RelatedArticles from "@/app/components/RelatedArticles";
import Responses from "@/app/components/Responses";
import Avatar from "@/app/components/ui/Avatar";

const sourceSerif = localFont({
  src: [
    {
      path: "../../../../public/fonts/SourceSerifPro-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../public/fonts/SourceSerifPro-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

function ReaderSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] px-5 pt-14 md:px-0">
      <div className="h-10 w-5/6 rounded shimmer" />
      <div className="mt-3 h-10 w-2/3 rounded shimmer" />
      <div className="mt-6 h-5 w-1/2 rounded shimmer" />
      <div className="mt-8 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full shimmer" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded shimmer" />
          <div className="h-3 w-24 rounded shimmer" />
        </div>
      </div>
      <div className="mt-10 aspect-[16/9] w-full rounded shimmer" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded shimmer" />
        ))}
      </div>
    </div>
  );
}

export default function ReadArticlePage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const toast = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const responsesRef = useRef(null);

  const { likes, bookmarks, toggleLike, toggleBookmark } = useUserActions(user);
  const isLiked = !!article && likes.has(article.id);
  const isBookmarked = !!article && bookmarks.has(article.id);

  /* ---------- reading progress ---------- */
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      setScrollProgress(scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------- article ---------- */
  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select(
          `
            *,
            users (
              id,
              name,
              username,
              avatar,
              bio
            )
          `,
        )
        .eq("slug", decodeURIComponent(slug))
        .eq("status", "published")
        .maybeSingle();

      if (error) console.error("Fetch article failed:", error);
      setArticle(data || null);
      setLoading(false);

      if (data) {
        document.title = `${data.seo_title || data.title} | Vichento`;
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("article_id", data.id);
        setLikeCount(count || 0);
      }
    };

    fetchArticle();
  }, [slug]);

  /* ---------- view tracking (throttled to 1 per 5 min per reader) ---------- */
  useEffect(() => {
    if (!article?.id) return;

    const trackView = async () => {
      const storageKey = `viewed_${article.id}`;
      let lastLocalView = 0;
      try {
        lastLocalView = parseInt(localStorage.getItem(storageKey), 10) || 0;
      } catch {}
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;
      let uniqueUser = false;

      if (user?.id) {
        const { data: lastView, error: lastViewError } = await supabase
          .from("views")
          .select("created_at")
          .eq("article_id", article.id)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastViewError) console.error("VIEW QUERY ERROR:", lastViewError);
        uniqueUser = !lastView?.created_at;
        if (lastView?.created_at && now - new Date(lastView.created_at).getTime() < FIVE_MINUTES) {
          return;
        }
      } else if (now - lastLocalView < FIVE_MINUTES) {
        return;
      }

      const meta = await buildAnalyticsPayload();
      const { error } = await supabase.from("views").insert([
        {
          article_id: article.id,
          user_id: user?.id || null,
          unique_user: uniqueUser,
          ...meta,
        },
      ]);

      if (error && error.code !== "23505") console.error("VIEW ERROR:", error);
      try {
        localStorage.setItem(storageKey, now.toString());
      } catch {}
    };

    trackView();
  }, [article?.id, user?.id]);

  /* ---------- actions ---------- */
  const requireUser = () => {
    if (user) return true;
    router.push(`/signin?next=${encodeURIComponent(`/read/${slug}`)}`);
    return false;
  };

  const handleLike = async () => {
    if (!requireUser()) return;
    const wasLiked = isLiked;
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
    const ok = await toggleLike(article.id);
    if (!ok) {
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
      toast("Couldn't update like", "error");
    }
  };

  const handleBookmark = async () => {
    if (!requireUser()) return;
    const ok = await toggleBookmark(article.id);
    if (!ok) toast("Couldn't update your list", "error");
    else toast(isBookmarked ? "Removed from your list" : "Saved to your list");
  };

  const handleShare = async () => {
    const result = await shareLink({ title: article.title, url: window.location.href });
    if (result === "copied") toast("Link copied to clipboard");
  };

  const scrollToResponses = () =>
    responsesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onResponseCount = useCallback((n) => setResponseCount(n), []);

  if (loading) return <ReaderSkeleton />;

  if (!article) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-creato text-3xl font-bold text-black">Story not found</h1>
        <p className="mt-3 max-w-sm text-sm text-gray-500">
          This story may have been unpublished, or the link might be wrong.
        </p>
        <Link
          href="/explore"
          className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm text-white hover:bg-gray-800"
        >
          Explore stories
        </Link>
      </div>
    );
  }

  const author = article.users || {};
  const authorName = author.name || "Author";
  const authorHref = `/profile/${author.username || article.author_id}`;
  const isAuthor = user?.id === article.author_id;
  const minutes = readingTime(article.content);
  const cover = getImageUrl(article.cover_image);

  const actionBar = (className = "") => (
    <div
      className={`flex items-center justify-between border-y border-gray-100 px-1 py-3 text-sm text-gray-500 ${className}`}
    >
      <div className="flex items-center gap-6">
        <button
          title="Like"
          onClick={handleLike}
          aria-pressed={isLiked}
          className="flex items-center gap-1.5 transition-colors hover:text-black active:scale-95"
        >
          {isLiked ? (
            <AiFillLike size={21} className="text-black" />
          ) : (
            <AiOutlineLike size={21} />
          )}
          <span>{likeCount > 0 ? likeCount : ""}</span>
        </button>

        <button
          title="Responses"
          onClick={scrollToResponses}
          className="flex items-center gap-1.5 transition-colors hover:text-black"
        >
          <FaRegComment size={18} />
          <span>{responseCount > 0 ? responseCount : ""}</span>
        </button>
      </div>

      <div className="flex items-center gap-5">
        <button
          title={isBookmarked ? "Remove from list" : "Save"}
          onClick={handleBookmark}
          aria-pressed={isBookmarked}
          className="transition-colors hover:text-black active:scale-95"
        >
          {isBookmarked ? (
            <TbBookmarksFilled size={21} className="text-black" />
          ) : (
            <TbBookmarks size={21} />
          )}
        </button>

        <button
          title="Share"
          onClick={handleShare}
          className="transition-colors hover:text-black active:scale-95"
        >
          <RxShare2 size={19} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="pb-24">
      {/* Reading progress */}
      <div className="fixed left-0 top-0 z-[100] h-[3px] w-full bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className="mx-auto max-w-[720px] px-5 md:px-0">
        <h1 className="mt-10 font-creato text-[32px] font-bold leading-[1.15] tracking-tight text-black md:mt-14 md:text-[42px]">
          {article.title}
        </h1>

        {article.meta_description && (
          <p className="mt-3 font-creato text-lg leading-snug text-black/55 md:text-[22px]">
            {article.meta_description}
          </p>
        )}

        {/* Author */}
        <div className="mt-8 flex items-center gap-3">
          <Link href={authorHref} className="shrink-0">
            <Avatar src={author.avatar} name={authorName} size={44} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={authorHref}
                className="truncate text-[15px] font-medium text-black hover:underline"
              >
                {authorName}
              </Link>
              {isAuthor && (
                <>
                  <span className="text-gray-300">·</span>
                  <Link href={`/write/${article.id}`} className="text-[14px] text-green-primary hover:underline">
                    Edit story
                  </Link>
                </>
              )}
            </div>
            <p className="text-[13px] text-gray-500">
              {minutes} min read · {formatDate(article.published_at || article.created_at, true)}
            </p>
          </div>
        </div>

        {actionBar("mt-8")}

        {cover && (
          <figure className="mt-10">
            <Image
              width={1400}
              height={800}
              priority
              src={cover}
              sizes="(min-width: 768px) 720px, 100vw"
              className="h-auto w-full rounded-sm object-cover"
              alt={article.title}
            />
          </figure>
        )}

        <div
          className={`prose prose-lg mt-10 max-w-none text-[20px] leading-8 text-black/85 ${sourceSerif.className}`}
        >
          {HTMLReactParser(sanitizeHtml(article.content))}
        </div>

        {article.categories?.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {article.categories.map((cat) => (
              <Link
                key={cat}
                href={`/explore?category=${encodeURIComponent(cat)}`}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {actionBar("mt-10")}

        {/* Written by */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href={authorHref}>
              <Avatar src={author.avatar} name={authorName} size={64} />
            </Link>
            <Link href={authorHref} className="mt-4 block">
              <h2 className="font-creato text-2xl font-bold text-black hover:underline">
                Written by {authorName}
              </h2>
            </Link>
            {author.bio && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">{author.bio}</p>
            )}
          </div>
          <Link
            href={authorHref}
            className="w-fit shrink-0 rounded-full border border-gray-300 px-5 py-2 text-sm text-black transition-colors hover:border-black"
          >
            View profile
          </Link>
        </div>

        <hr className="mt-12 border-gray-100" />

        <div ref={responsesRef} className="scroll-mt-24 pt-12">
          <Responses articleId={article.id} onCountChange={onResponseCount} />
        </div>
      </article>

      <div className="mt-16 bg-gray-50 py-14">
        <div className="mx-auto max-w-[720px] px-5 md:px-0">
          <RelatedArticles
            categories={article.categories}
            currentId={article.id}
            authorId={article.author_id}
          />
          <Link
            href="/explore"
            className="mt-12 inline-block rounded-full border border-gray-300 bg-white px-5 py-2 text-sm hover:border-black"
          >
            See all stories
          </Link>
        </div>
      </div>
    </div>
  );
}
