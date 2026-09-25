"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { formatDate } from "@/lib/articleUtils";
import ViewsBarChart, { bucketViews } from "@/app/components/ViewsBarChart";

const RANGES = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
];

const tally = (rows, key, fallback) =>
  Object.entries(
    rows.reduce((acc, r) => {
      const k = r[key] || fallback;
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

function Breakdown({ title, items, total, emptyTitle, emptyHint, favicon }) {
  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold text-black">{title}</h2>
      {items.length > 0 ? (
        <div className="space-y-4 font-sans">
          {items.slice(0, 8).map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {favicon && !/unknown|direct/i.test(item.label) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.label)}&sz=32`}
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-sm"
                      />
                    )}
                    <p className="truncate text-[14px] font-medium text-black">{item.label}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[13px] text-gray-400">{pct.toFixed(1)}%</span>
                    <span className="w-8 text-right text-[14px] font-semibold text-black">
                      {item.count}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-black transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 py-10 text-center font-sans text-gray-500">
          <p className="text-sm">{emptyTitle}</p>
          {emptyHint && <p className="mt-1 text-[13px] text-gray-400">{emptyHint}</p>}
        </div>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const [article, setArticle] = useState(null);
  const [views, setViews] = useState([]);
  const [counts, setCounts] = useState({ likes: 0, bookmarks: 0, responses: 0 });
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  useEffect(() => {
    if (!user || !id) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      const { data: articleData } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .eq("author_id", user.id)
        .maybeSingle();

      if (!articleData) {
        setArticle(null);
        setLoading(false);
        return;
      }

      const head = { count: "exact", head: true };
      const [viewsRes, likesRes, bookmarksRes, commentsRes] = await Promise.all([
        supabase
          .from("views")
          .select("created_at, referrer, utm_source, device_type, device_os, device_browser, location, unique_user")
          .eq("article_id", id)
          .order("created_at", { ascending: true })
          .limit(20000),
        supabase.from("likes").select("*", head).eq("article_id", id),
        supabase.from("bookmarks").select("*", head).eq("article_id", id),
        supabase.from("comments").select("*", head).eq("article_id", id),
      ]);

      setArticle(articleData);
      setViews(viewsRes.data || []);
      setCounts({
        likes: likesRes.count || 0,
        bookmarks: bookmarksRes.count || 0,
        responses: commentsRes.count || 0,
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [id, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 pt-16 md:px-6">
        <div className="h-4 w-24 rounded shimmer" />
        <div className="h-9 w-3/4 rounded shimmer" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded shimmer" />
          ))}
        </div>
        <div className="h-[260px] rounded-xl shimmer" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-creato text-xl font-bold text-black">Story not found</p>
        <p className="mt-2 text-sm text-gray-500">
          You can only view stats for your own stories.
        </p>
        <Link href="/stats" className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm text-white">
          Back to stats
        </Link>
      </div>
    );
  }

  const now = new Date();
  const rangeStart = new Date(now.getTime() - (rangeDays - 1) * 864e5);
  rangeStart.setHours(0, 0, 0, 0);
  const chartData = bucketViews(
    views.filter((v) => new Date(v.created_at) >= rangeStart),
    rangeStart,
    now,
  );

  const totalViews = views.length;
  const uniqueReaders = views.filter((v) => v.unique_user).length;

  const downloadCSV = () => {
    const rows = [["date", "views"], ...chartData.map((r) => [r.label, r.views])];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.slug || id}-views-${rangeDays}d.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-white pb-20">
      <div className="mx-auto max-w-4xl px-4 pt-12 font-creato md:px-6 md:pt-16">
        <Link
          href="/stats"
          className="mb-8 inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-black"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-[14px]">All stats</span>
        </Link>

        {/* Header */}
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-tight text-black md:text-3xl">
            {article.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[13px] text-gray-500">
            <span>
              {article.status === "published" ? "Published" : "Draft"} ·{" "}
              {formatDate(article.published_at || article.created_at, true)}
            </span>
            {article.status === "published" && (
              <Link href={`/read/${article.slug}`} className="underline underline-offset-2 hover:text-black">
                View story
              </Link>
            )}
            <Link href={`/write/${article.id}`} className="underline underline-offset-2 hover:text-black">
              Edit
            </Link>
          </div>
        </div>

        {/* High Level Stats */}
        <div className="mb-14 grid grid-cols-2 gap-6 md:grid-cols-5">
          {[
            ["Views", totalViews],
            ["Unique readers", uniqueReaders],
            ["Likes", counts.likes],
            ["Saves", counts.bookmarks],
            ["Responses", counts.responses],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="mb-1 font-sans text-[12px] uppercase tracking-wider text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-black md:text-4xl">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-black">Views over time</h2>
            <div className="flex items-center gap-2 font-sans">
              {RANGES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRangeDays(key)}
                  aria-pressed={rangeDays === key}
                  className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${
                    rangeDays === key
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={downloadCSV}
                title="Download CSV"
                aria-label="Download CSV"
                className="ml-1 rounded-full border border-gray-200 p-1.5 text-gray-600 hover:border-gray-400 hover:text-black"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {totalViews > 0 ? (
            <ViewsBarChart data={chartData} height={290} />
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 font-sans text-sm text-gray-500">
              No views recorded yet. Share your story to get it in front of readers.
            </div>
          )}
        </section>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
          <Breakdown
            title="Traffic sources"
            items={tally(views, "referrer", "Direct / Unknown")}
            total={totalViews}
            favicon
            emptyTitle="No referral data yet."
            emptyHint="Sources appear as people visit your story."
          />
          <Breakdown
            title="UTM sources"
            items={tally(views, "utm_source", "Direct / Unknown")}
            total={totalViews}
            emptyTitle="No UTM data yet."
            emptyHint="Add ?utm_source=… to links you share."
          />
          <Breakdown
            title="Devices"
            items={tally(views, "device_type", "Unknown")}
            total={totalViews}
            emptyTitle="No device data yet."
          />
          <Breakdown
            title="Top locations"
            items={tally(views, "location", "Unknown")}
            total={totalViews}
            emptyTitle="No location data yet."
          />
        </div>
      </div>
    </div>
  );
}
