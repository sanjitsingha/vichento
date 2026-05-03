'use client'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient';
import { RxShare2 } from "react-icons/rx";
import { BsThreeDots } from "react-icons/bs";
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { useAuthContext } from '@/context/AuthContext';


const page = () => {
  const { user } = useAuthContext();
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [draftArticles, setDraftArticles] = useState([]);
  const [stats, setStats] = useState({ totalViews: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAllArticles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          views:views(count),
          likes:likes(count)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log("Error fetching articles:", error);
      } else {
        const published = data.filter(a => a.status === 'published').map(article => {
          const vCount = Array.isArray(article.views) ? article.views[0]?.count : article.views?.count;
          const lCount = Array.isArray(article.likes) ? article.likes[0]?.count : article.likes?.count;
          return {
            ...article,
            vCount: vCount || 0,
            lCount: lCount || 0
          };
        });

        const drafts = data.filter(a => a.status === 'draft');

        let viewsCount = 0;
        let likesCount = 0;

        published.forEach(article => {
          viewsCount += article.vCount;
          likesCount += article.lCount;
        });

        setPublishedArticles(published);
        setDraftArticles(drafts);
        setStats({ totalViews: viewsCount, totalLikes: likesCount });
      }
      setLoading(false);
    }

    fetchAllArticles();

  }, [user]);

  const handleShare = async (article) => {
    const url = `${window.location.origin}/read/${article.slug || article.id}`;
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.subtitle || article.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  };

  const latestPublished = publishedArticles[0];

  return (
    <div className="w-full bg-white min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-16 font-creato">

        {/* Header */}
        <h1 className="text-4xl font-semibold tracking-tight text-black mb-12">Stats</h1>

        {loading ? (
          <p className="text-gray-500">Loading stats...</p>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="w-full grid grid-cols-3 gap-6 mb-14">
              <div className="py-6 px-5 ">
                <p className="text-[13px] text-gray-500 mb-1 tracking-wide uppercase">Stories Published</p>
                <p className="text-4xl font-bold text-black tracking-tight">{publishedArticles.length}</p>
              </div>
              <div className="py-6 px-5 ">
                <p className="text-[13px] text-gray-500 mb-1 tracking-wide uppercase">Views</p>
                <p className="text-4xl font-bold text-black tracking-tight">{stats.totalViews}</p>
              </div>
              <div className="py-6 px-5  ">
                <p className="text-[13px] text-gray-500 mb-1 tracking-wide uppercase">Likes</p>
                <p className="text-4xl font-bold text-black tracking-tight">{stats.totalLikes}</p>
              </div>
            </div>

            {/* Two Column: Latest Published + Drafts */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">

              {/* Latest Published Card */}
              <div className="w-full border border-gray-200 rounded-xl p-6">
                <h2 className="text-[15px] font-semibold text-black mb-6">Latest Published</h2>

                {latestPublished ? (
                  <>
                    <div className="flex gap-4 pb-5 border-b border-gray-100">
                      <div className="overflow-hidden relative w-[110px] h-[80px] shrink-0 rounded bg-gray-100">
                        <Image src={latestPublished.cover_image || '/placeholder.png'} fill={true} alt="title" style={{ objectFit: 'cover' }} className="rounded" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <Link href={`/read/${latestPublished.slug || latestPublished.id}`} className="hover:underline">
                          <p className="text-[15px] line-clamp-2 text-black font-medium leading-snug">{latestPublished.title}</p>
                        </Link>
                        <p className="text-[13px] text-gray-400 mt-1">
                          {new Date(latestPublished.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] text-gray-500">Views</p>
                        <p className="text-[18px] font-bold text-black">{latestPublished.vCount}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] text-gray-500">Likes</p>
                        <p className="text-[18px] font-bold text-black">{latestPublished.lCount}</p>
                      </div>
                      <div className="flex items-center gap-3 pt-3">
                        <button onClick={() => handleShare(latestPublished)} className="flex items-center gap-2 text-[14px] text-gray-600 border border-gray-200 px-5 py-2 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
                          Share <RxShare2 className="text-gray-500" size={16} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer ml-auto">
                          <BsThreeDots size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[14px] text-gray-500 text-center py-4">No stories published yet.</p>
                )}
              </div>

              {/* Drafts Card */}
              <div className="w-full border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[15px] font-semibold text-black">Drafts</h2>
                  <Link href="/stories?tab=drafts" className="text-[13px] text-gray-400 hover:text-black transition-colors">
                    View all
                  </Link>
                </div>

                <div className="space-y-0">
                  {draftArticles.length > 0 ? draftArticles.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
                      <div className="w-14 h-14 shrink-0 overflow-hidden rounded bg-gray-100 relative">
                        <Image src={item.cover_image || '/placeholder.png'} fill={true} alt="title" className="rounded object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/write?id=${item.id}`} className="hover:underline">
                          <p className="text-[14px] text-black font-medium line-clamp-1">{item.title || "Untitled Draft"}</p>
                        </Link>
                        <p className="text-[13px] text-gray-400 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-[12px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">Draft</span>
                    </div>
                  )) : (
                    <p className="text-[14px] text-gray-500 text-center py-4">No drafts available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* All Articles Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[15px] font-semibold text-black">All Articles</h2>
                <Link href="/stories?tab=published" className="text-[13px] text-gray-400 hover:text-black transition-colors flex items-center gap-1.5">
                  View all <ArrowUpRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-col">
                {publishedArticles.map((item) => (
                  <div key={item.id} className="py-5 flex items-start gap-5 border-b border-gray-100 group">
                    <div className="overflow-hidden relative w-[120px] h-[84px] shrink-0 rounded bg-gray-100">
                      <Image src={item.cover_image || '/placeholder.png'} fill={true} alt="title" style={{ objectFit: 'cover' }} className="rounded" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <Link href={`/read/${item.slug || item.id}`}>
                        <p className="text-[16px] font-bold text-black line-clamp-1 leading-snug group-hover:underline decoration-gray-300 underline-offset-4">{item.title}</p>
                      </Link>
                      <p className="text-[13px] text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {' • '}
                        {item.vCount} Views
                        {' • '}
                        {item.lCount} Likes
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-center">
                      <Link
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black"
                        href={`/stats/${item.id}`}
                        title="View Analytics"
                      >
                        <ArrowUpRightIcon className="w-[18px] h-[18px]" />
                      </Link>
                      <button
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black cursor-pointer"
                        title="More options"
                      >
                        <HiOutlineDotsHorizontal className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                ))}
                {publishedArticles.length === 0 && (
                  <p className="text-[14px] text-gray-500 text-center py-4">You haven't published any articles yet.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default page