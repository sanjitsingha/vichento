"use client";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
  TrashIcon,
  ArrowTrendingUpIcon,
  EllipsisHorizontalIcon,
  ArrowUturnLeftIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { QueueListIcon as QueueSolid } from "@heroicons/react/24/solid";
import { PiShareFatThin } from "react-icons/pi";

import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";


const page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "drafts");
  const { user } = useAuthContext();
  const [drafts, setDrafts] = useState([]);
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [loading, setLoading] = useState(true);


  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // ✅ close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);


  useEffect(() => {
    if (!user) return;

    const fetchArticles = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        setLoading(false);
        return;
      }

      // ✅ SEGREGATE DATA HERE
      const draftsData = data.filter((item) => item.status === "draft");
      const publishedData = data.filter((item) => item.status === "published");

      setDrafts(draftsData);
      setPublishedArticles(publishedData);

      setLoading(false);
    };

    fetchArticles();
  }, [user]);


  // console.log(publishedArticles)






  return (
    <div className="w-full bg-white min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-16 font-creato">

        {/* Header Section */}
        <div className="w-full flex justify-between items-end mb-12 ">
          <h1 className="text-4xl font-semibold tracking-tight text-black">Your stories</h1>
          {/* <div className="flex items-center gap-4 mb-1">
            <Link
              href="/write"
              className="bg-black text-white px-5 py-2 rounded-full text-[14px] font-medium hover:bg-gray-800 transition-colors"
            >
              Write a story
            </Link>
          </div> */}
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-gray-100">
          <button
            onClick={() => {
              setActiveTab("drafts");
              router.push("/stories?tab=drafts");
            }}
            className={`pb-4 text-[15px] font-medium transition-colors cursor-pointer relative ${activeTab === "drafts"
              ? "text-black"
              : "text-gray-500 hover:text-black"
              }`}
          >
            Drafts {drafts.length > 0 && <span className="ml-1 text-gray-400 font-normal">{drafts.length}</span>}
            {activeTab === "drafts" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black"></span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("published");
              router.push("/stories?tab=published");
            }}
            className={`pb-4 text-[15px] font-medium transition-colors cursor-pointer relative ${activeTab === "published"
              ? "text-black"
              : "text-gray-500 hover:text-black"
              }`}
          >
            Published {publishedArticles.length > 0 && <span className="ml-1 text-gray-400 font-normal">{publishedArticles.length}</span>}
            {activeTab === "published" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black"></span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="w-full">
          {loading ? (
            <div className="py-10 text-center">
              <p className="text-gray-500 text-[15px]">Loading stories...</p>
            </div>
          ) : activeTab === "drafts" ? (
            drafts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-black font-medium text-lg mb-2">You have no drafts.</p>
                <p className="text-gray-500 text-[15px]">Write a story that matters to you.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {drafts.map((draft) => (
                  <div key={draft.id} className="py-6 flex items-start border-b border-gray-100 gap-6 group">
                    <div className="flex-1">
                      <Link href={`/read/${draft.slug || draft.id}`}>
                        <h2 className="text-[20px] font-bold text-black mb-2 line-clamp-2 group-hover:underline decoration-gray-300 underline-offset-4 leading-snug">
                          {draft.title || "Untitled Draft"}
                        </h2>
                        {draft.subtitle && (
                          <p className="text-[15px] text-gray-500 line-clamp-2 mb-3">
                            {draft.subtitle}
                          </p>
                        )}
                      </Link>
                      <div className="flex items-center text-[13px] text-gray-500 mt-2">
                        <span>Last edited {new Date(draft.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}</span>
                      </div>
                    </div>

                    {draft.cover_image && (
                      <div className="hidden sm:block shrink-0">
                        <Image
                          src={draft.cover_image}
                          width={112}
                          height={112}
                          alt="Cover Image"
                          className="object-cover rounded w-28 h-28 border border-gray-100"
                        />
                      </div>
                    )}

                    <div className="relative shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === draft.id ? null : draft.id);
                        }}
                        className="p-1 cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <EllipsisHorizontalIcon className="w-6 h-6 text-gray-500" />
                      </button>

                      {activeMenu === draft.id && (
                        <div className="absolute right-0 top-8 w-48 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-50 py-1">
                          <Link
                            href={`/read/${draft.slug || draft.id}`}
                            className="flex px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors items-center gap-3"
                            onClick={() => setActiveMenu(null)}
                          >
                            <ArrowUturnLeftIcon className="w-4 h-4 text-gray-400" />
                            <span>Continue writing</span>
                          </Link>

                          <button
                            onClick={() => typeof handleDelete === 'function' && handleDelete(draft.id)}
                            className="flex px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 transition-colors items-center gap-3 w-full text-left"
                          >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                            <span>Delete draft</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "published" ? (
            publishedArticles.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-black font-medium text-lg mb-2">You haven't published any stories yet.</p>
                <p className="text-gray-500 text-[15px]">Your published stories will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {publishedArticles.map((article) => (
                  <div key={article.id} className="py-6 flex items-start border-b border-gray-100 gap-6 group">
                    <div className="flex-1">
                      <Link href={`/read/${article.slug || article.id}`}>
                        <h2 className="text-[20px] font-bold text-black mb-2 line-clamp-2 group-hover:underline decoration-gray-300 underline-offset-4 leading-snug">
                          {article.title}
                        </h2>
                        {article.subtitle && (
                          <p className="text-[15px] text-gray-500 line-clamp-2 mb-3">
                            {article.subtitle}
                          </p>
                        )}
                      </Link>
                      <div className="flex items-center text-[13px] text-gray-500 mt-2 gap-2">
                        <span>Published on {new Date(article.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}</span>
                      </div>
                    </div>

                    {article.cover_image && (
                      <div className="hidden sm:block shrink-0">
                        <Image
                          src={article.cover_image}
                          width={112}
                          height={112}
                          alt={article.title}
                          className="object-cover rounded w-28 h-28 border border-gray-100"
                        />
                      </div>
                    )}

                    <div className="relative shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === article.id ? null : article.id);
                        }}
                        className="p-1 cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <EllipsisHorizontalIcon className="w-6 h-6 text-gray-500" />
                      </button>

                      {activeMenu === article.id && (
                        <div className="absolute right-0 top-8 w-48 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-50 py-1">
                          <Link
                            href={`/read/${article.slug || article.id}`}
                            className="flex px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors items-center gap-3"
                            onClick={() => setActiveMenu(null)}
                          >
                            <ArrowTrendingUpIcon className="w-4 h-4 text-gray-400" />
                            <span>View stats</span>
                          </Link>

                          <Link
                            href={`/read/${article.slug || article.id}`}
                            className="flex px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors items-center gap-3 border-b border-gray-100 pb-3 mb-1"
                            onClick={() => setActiveMenu(null)}
                          >
                            <PiShareFatThin className="w-4 h-4 text-gray-400" />
                            <span>Share</span>
                          </Link>

                          <Link
                            href={`/read/${article.slug || article.id}`}
                            className="flex px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors items-center gap-3"
                            onClick={() => setActiveMenu(null)}
                          >
                            <ArrowUturnLeftIcon className="w-4 h-4 text-gray-400" />
                            <span>Unpublish</span>
                          </Link>

                          <Link
                            href={`/read/${article.slug || article.id}`}
                            className="flex px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 transition-colors items-center gap-3 w-full text-left"
                            onClick={() => setActiveMenu(null)}
                          >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                            <span>Delete story</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default page;