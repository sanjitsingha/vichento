"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { RxShare2 } from "react-icons/rx";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, getImageUrl, shareLink } from "@/lib/articleUtils";
import { IMAGE_PLACEHOLDER } from "@/lib/constants";
import ViewsBarChart, { bucketViews } from "@/app/components/ViewsBarChart";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_RANGES = [
  { key: "today", label: "Today" },
  { key: "48h", label: "48 Hours" },
  { key: "7d", label: "7 Days" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

/** Returns [startISO, endISO] for the given range. */
function getRange(key, custom) {
  const now = new Date();
  const end = now.toISOString();
  switch (key) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return [d.toISOString(), end];
    }
    case "48h":
      return [new Date(now.getTime() - 48 * 36e5).toISOString(), end];
    case "month":
      return [new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end];
    case "custom":
      return [
        new Date(`${custom.from}T00:00:00`).toISOString(),
        new Date(`${custom.to}T23:59:59`).toISOString(),
      ];
    case "7d":
    default: {
      const d = new Date(now.getTime() - 6 * 864e5);
      d.setHours(0, 0, 0, 0);
      return [d.toISOString(), end];
    }
  }
}

const today = () => new Date().toISOString().split("T")[0];

function StatTile({ label, value }) {
  return (
    <div className="py-2">
      <p className="mb-1 font-sans text-[12px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-4xl font-bold tracking-tight text-black">{value.toLocaleString()}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { user } = useAuthContext();
  const toast = useToast();

  const [publishedArticles, setPublishedArticles] = useState([]);
  const [draftArticles, setDraftArticles] = useState([]);
  const [stats, setStats] = useState({ totalViews: 0, totalLikes: 0, totalBookmarks: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeRange, setActiveRange] = useState("7d");
  const [customDraft, setCustomDraft] = useState({ from: "", to: "" });
  const [customApplied, setCustomApplied] = useState(null);

  const rangeReady = activeRange !== "custom" || !!customApplied;
  const customKey = customApplied ? `${customApplied.from}|${customApplied.to}` : "";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !rangeReady) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [start, end] = getRange(
        activeRange,
        customKey ? { from: customKey.split("|")[0], to: customKey.split("|")[1] } : null,
      );

      const { data: articlesData, error } = await supabase
        .from("articles")
        .select("id, title, slug, status, cover_image, created_at, updated_at, published_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error("Error fetching articles:", error);
        setLoading(false);
        return;
      }

      const published = articlesData.filter((a) => a.status === "published");
      const drafts = articlesData.filter((a) => a.status === "draft");
      const ids = published.map((a) => a.id);

      let views = [];
      let likes = [];
      let bookmarkCount = 0;

      if (ids.length) {
        const [viewsRes, likesRes, bookmarksRes] = await Promise.all([
          supabase
            .from("views")
            .select("article_id, created_at")
            .in("article_id", ids)
            .gte("created_at", start)
            .lte("created_at", end)
            .limit(10000),
          supabase.from("likes").select("article_id").in("article_id", ids).limit(10000),
          supabase
            .from("bookmarks")
            .select("*", { count: "exact", head: true })
            .in("article_id", ids),
        ]);
        views = viewsRes.data || [];
        likes = likesRes.data || [];
        bookmarkCount = bookmarksRes.count || 0;
      }

      if (cancelled) return;

      const countBy = (rows) =>
        rows.reduce((acc, r) => ((acc[r.article_id] = (acc[r.article_id] || 0) + 1), acc), {});
      const vMap = countBy(views);
      const lMap = countBy(likes);

      setPublishedArticles(
        published.map((a) => ({ ...a, vCount: vMap[a.id] || 0, lCount: lMap[a.id] || 0 })),
      );
      setDraftArticles(drafts);
      setStats({
        totalViews: views.length,
        totalLikes: likes.length,
        totalBookmarks: bookmarkCount,
      });
      setChartData(bucketViews(views, start, end));
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, activeRange, customKey, rangeReady]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleShare = async (article) => {
    const result = await shareLink({
      title: article.title,
      url: `${window.location.origin}/read/${article.slug || article.id}`,
    });
    if (result === "copied") toast("Link copied");
  };

  const latestPublished = publishedArticles[0];
  const topStory = publishedArticles.reduce(
    (best, item) => (item.vCount > (best?.vCount || 0) ? item : best),
    null,
  );
  const rangeLabel = TIME_RANGES.find((r) => r.key === activeRange)?.label.toLowerCase();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-white pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-12 font-creato md:px-6 md:pt-16">
        <h1 className="mb-8 text-4xl font-semibold tracking-tight text-black">Stats</h1>

        {/* ── Time Range Filter ── */}
        <div className="mb-10">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {TIME_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveRange(key)}
                aria-pressed={activeRange === key}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
                  activeRange === key
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-black"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeRange === "custom" && (
            <div className="mt-4 flex flex-wrap items-center gap-3 font-sans">
              <label className="flex items-center gap-2 text-[13px] text-gray-500">
                From
                <input
                  type="date"
                  value={customDraft.from}
                  max={customDraft.to || today()}
                  onChange={(e) => setCustomDraft((c) => ({ ...c, from: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] text-black focus:border-black focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] text-gray-500">
                To
                <input
                  type="date"
                  value={customDraft.to}
                  min={customDraft.from}
                  max={today()}
                  onChange={(e) => setCustomDraft((c) => ({ ...c, to: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] text-black focus:border-black focus:outline-none"
                />
              </label>
              <button
                onClick={() => setCustomApplied({ ...customDraft })}
                disabled={!customDraft.from || !customDraft.to}
                className="rounded-full bg-black px-4 py-1.5 text-[13px] text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {!rangeReady ? (
          <p className="py-10 text-center font-sans text-sm text-gray-500">
            Pick a start and end date, then press Apply.
          </p>
        ) : loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-16 rounded shimmer" />
                  <div className="h-9 w-20 rounded shimmer" />
                </div>
              ))}
            </div>
            <div className="h-[260px] w-full rounded-xl shimmer" />
          </div>
        ) : (
          <>
            {/* Stat Tiles */}
            <div className="mb-10 grid w-full grid-cols-2 gap-6 md:grid-cols-4">
              <StatTile label="Published" value={publishedArticles.length} />
              <StatTile label="Views" value={stats.totalViews} />
              <StatTile label="Likes" value={stats.totalLikes} />
              <StatTile label="Saves" value={stats.totalBookmarks} />
            </div>

            {topStory && topStory.vCount > 0 && (
              <Link
                href={`/stats/${topStory.id}`}
                className="mb-10 block rounded-2xl border border-gray-100 p-6 transition-colors hover:border-gray-300"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="mb-1 flex items-center gap-2 font-sans text-[12px] uppercase tracking-wider text-gray-500">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      Top performing story
                    </p>
                    <h2 className="line-clamp-2 text-xl font-semibold leading-tight text-black">
                      {topStory.title}
                    </h2>
                  </div>
                  <div className="shrink-0 font-sans md:text-right">
                    <p className="text-[13px] text-gray-500">
                      {topStory.vCount} views {rangeLabel === "custom" ? "in range" : `· ${rangeLabel}`}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-black">
                      {topStory.lCount} likes
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Chart Section */}
            <section className="mb-14">
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-[15px] font-semibold text-black">Views over time</h2>
                <span className="font-sans text-[13px] text-gray-400">
                  {stats.totalViews.toLocaleString()} total
                </span>
              </div>
              {publishedArticles.length ? (
                <ViewsBarChart data={chartData} />
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 font-sans text-sm text-gray-500">
                  Publish a story to start seeing views.
                </div>
              )}
            </section>

            {/* Two Column: Latest Published + Drafts */}
            <div className="mb-14 grid w-full grid-cols-1 gap-8 md:grid-cols-2">
              <div className="w-full rounded-xl border border-gray-200 p-6">
                <h2 className="mb-6 text-[15px] font-semibold text-black">Latest published</h2>
                {latestPublished ? (
                  <>
                    <div className="flex gap-4 border-b border-gray-100 pb-5">
                      <div className="relative h-[70px] w-[100px] shrink-0 overflow-hidden rounded bg-gray-100">
                        <Image
                          src={getImageUrl(latestPublished.cover_image) || IMAGE_PLACEHOLDER}
                          fill
                          sizes="100px"
                          alt=""
                          className="object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-col justify-center">
                        <Link
                          href={`/read/${latestPublished.slug || latestPublished.id}`}
                          className="hover:underline"
                        >
                          <p className="line-clamp-2 text-[15px] font-medium leading-snug text-black">
                            {latestPublished.title}
                          </p>
                        </Link>
                        <p className="mt-1 font-sans text-[13px] text-gray-400">
                          {formatDate(latestPublished.published_at || latestPublished.created_at, true)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 pt-5 font-sans">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] text-gray-500">Views ({rangeLabel})</p>
                        <p className="text-[18px] font-bold text-black">{latestPublished.vCount}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] text-gray-500">Likes</p>
                        <p className="text-[18px] font-bold text-black">{latestPublished.lCount}</p>
                      </div>
                      <div className="flex items-center gap-3 pt-3">
                        <button
                          onClick={() => handleShare(latestPublished)}
                          className="flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-[14px] text-gray-600 transition-colors hover:bg-gray-50"
                        >
                          Share <RxShare2 className="text-gray-500" size={16} />
                        </button>
                        <Link
                          href={`/stats/${latestPublished.id}`}
                          className="ml-auto text-[14px] text-gray-500 hover:text-black"
                        >
                          Details →
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="py-4 text-center font-sans text-[14px] text-gray-500">
                    No stories published yet.
                  </p>
                )}
              </div>

              <div className="w-full rounded-xl border border-gray-200 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-black">Drafts</h2>
                  <Link
                    href="/stories?tab=drafts"
                    className="font-sans text-[13px] text-gray-400 transition-colors hover:text-black"
                  >
                    View all
                  </Link>
                </div>
                {draftArticles.length > 0 ? (
                  draftArticles.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/write/${item.id}`}
                      className="group flex items-center gap-4 border-b border-gray-100 py-4 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-[14px] font-medium text-black group-hover:underline">
                          {item.title || "Untitled draft"}
                        </p>
                        <p className="mt-0.5 font-sans text-[13px] text-gray-400">
                          Edited {formatDate(item.updated_at || item.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 font-sans text-[12px] text-gray-500">
                        Draft
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-center font-sans text-[14px] text-gray-500">
                    No drafts right now.
                  </p>
                )}
              </div>
            </div>

            {/* All Articles Section */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-black">All stories</h2>
                <Link
                  href="/stories?tab=published"
                  className="flex items-center gap-1.5 font-sans text-[13px] text-gray-400 transition-colors hover:text-black"
                >
                  Manage <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
              {publishedArticles.length > 0 ? (
                publishedArticles.map((item) => (
                  <Link
                    key={item.id}
                    href={`/stats/${item.id}`}
                    className="group flex items-center gap-5 border-b border-gray-100 py-5"
                  >
                    <div className="relative h-[64px] w-[96px] shrink-0 overflow-hidden rounded bg-gray-100">
                      <Image
                        src={getImageUrl(item.cover_image) || IMAGE_PLACEHOLDER}
                        fill
                        sizes="96px"
                        alt=""
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[16px] font-bold leading-snug text-black decoration-gray-300 underline-offset-4 group-hover:underline">
                        {item.title}
                      </p>
                      <p className="mt-1 font-sans text-[13px] text-gray-400">
                        {formatDate(item.published_at || item.created_at, true)} · {item.vCount} views ·{" "}
                        {item.lCount} likes
                      </p>
                    </div>
                    <ArrowUpRightIcon className="h-[18px] w-[18px] shrink-0 text-gray-400 transition-colors group-hover:text-black" />
                  </Link>
                ))
              ) : (
                <p className="py-4 text-center font-sans text-[14px] text-gray-500">
                  You haven&apos;t published any stories yet.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
