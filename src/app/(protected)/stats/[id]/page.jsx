"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

export default function AnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [referrerData, setReferrerData] = useState([]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("articles")
          .select(`
            *,
            views(created_at, referrer),
            likes(created_at),
            bookmarks(created_at)
          `)
          .eq("id", id)
          .eq("author_id", user.id)
          .single();

        if (error) throw error;

        setArticle(data);

        // Process views for the chart
        if (data && data.views) {
          // Sort views by date
          const sortedViews = [...data.views].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const orderedViewsByDate = sortedViews.reduce((acc, view) => {
            const dateStr = new Date(view.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            acc[dateStr] = (acc[dateStr] || 0) + 1;
            return acc;
          }, {});

          setChartData(Object.keys(orderedViewsByDate).map(date => ({
            date,
            views: orderedViewsByDate[date]
          })));

          // Process referrer data
          const referrerCounts = sortedViews.reduce((acc, view) => {
            const source = view.referrer || 'Direct / Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          }, {});

          const sortedReferrers = Object.entries(referrerCounts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count);

          setReferrerData(sortedReferrers);
        }

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id, user]);

  if (loading) {
    return (
      <div className="w-full bg-white min-h-screen pt-24 text-center">
        <p className="text-gray-500 font-creato">Loading analytics...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full bg-white min-h-screen pt-24 text-center">
        <p className="text-black text-xl font-bold font-creato">Article not found</p>
        <button onClick={() => router.back()} className="text-gray-500 mt-4 underline">Go Back</button>
      </div>
    );
  }

  const totalViews = article.views?.length || 0;
  const totalLikes = article.likes?.length || 0;
  const totalBookmarks = article.bookmarks?.length || 0;

  return (
    <div className="w-full bg-white min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 font-creato">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-[14px]">Back to Stats</span>
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 border-b border-gray-100 pb-8">
          <div className="flex items-center gap-6">
            {/* <div className="w-24 h-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 relative">
              <Image src={article.cover_image || '/placeholder.png'} fill={true} alt={article.title} className="object-cover" />
            </div> */}
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-black line-clamp-2 leading-tight">{article.title}</h1>
              <p className="text-[13px] text-gray-500 mt-">
                Published on {new Date(article.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          {/* <div className="shrink-0 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <p className="text-[12px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Status</p>
            <p className="text-[15px] text-black capitalize font-medium">{article.status}</p>
          </div> */}
        </div>

        {/* High Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white  ">
            <div className="flex items-center gap-3 mb-4">
              {/* <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div> */}
              <p className="text-[14px] text-gray-500 font-medium">Total Views</p>
            </div>
            <p className="text-4xl font-bold text-black">{totalViews}</p>
          </div>

          <div className="bg-white  ">
            <div className="flex items-center gap-3 mb-4">
              {/* <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div> */}
              <p className="text-[14px] text-gray-500 font-medium">Total Likes</p>
            </div>
            <p className="text-4xl font-bold text-black">{totalLikes}</p>
          </div>

          <div className="bg-white  ">
            <div className="flex items-center gap-3 mb-4">
              {/* <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div> */}
              <p className="text-[14px] text-gray-500 font-medium">Bookmarks</p>
            </div>
            <p className="text-4xl font-bold text-black">{totalBookmarks}</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="w-full bg-white  mt-20">
          <h2 className="text-xl font-semibold text-black mb-8">Views Over Time</h2>

          <div className="w-full h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 13 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#000000"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    activeDot={{ r: 6, fill: "#000000", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <p>No views recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Traffic Sources Section */}
        <div className="w-full bg-white mt-16">
          <h2 className="text-xl font-semibold text-black mb-8">Traffic Sources</h2>

          {referrerData.length > 0 ? (
            <div className="space-y-4">
              {referrerData.map((item, index) => {
                const maxCount = referrerData[0].count;
                const percentage = totalViews > 0 ? ((item.count / totalViews) * 100).toFixed(1) : 0;
                const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {item.source !== 'Direct / Unknown' && (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${item.source}&sz=32`}
                            alt=""
                            className="w-4 h-4 rounded-sm"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <p className="text-[14px] text-black font-medium">
                          {item.source}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] text-gray-400 font-medium">{percentage}%</span>
                        <span className="text-[14px] text-black font-semibold w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full py-12 flex flex-col items-center justify-center text-gray-400">
              <p>No referral data recorded yet.</p>
              <p className="text-[13px] mt-1">Traffic sources will appear as people visit your article.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
