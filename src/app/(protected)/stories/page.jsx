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

const page = () => {
  const [activeTab, setActiveTab] = useState("drafts");
  const { user } = useAuthContext();
  const [drafts, setDrafts] = useState([]);
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [loading, setLoading] = useState(true);


  const [activeMenu, setActiveMenu] = useState(null);

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
    <div className="w-full p-4 md:p-0">
      <div className="max-w-[800px] mx-auto pt-10">
        <div className="w-full flex justify-between items-center pb-1 border-b border-gray-300 mb-4">
          <p className="text-[24px] tracking-tight text-black font-creato">Stories</p>
          <QueueSolid className="text-gray-500 size-6" />
        </div>

        {/* Tabs */}
        <div className="mt-3 border-gray-300  border-[.5px] rounded py-2 w-fit  px-6 flex gap-6">
          <button
            onClick={() => setActiveTab("drafts")}
            className={`text-[14px] cursor-pointer ${activeTab === "drafts"
              ? "text-black font-bold "
              : "text-gray-500"
              }`}
          >
            Drafts
          </button>

          <button
            onClick={() => setActiveTab("published")}
            className={`text-[14px] cursor-pointer ${activeTab === "published"
              ? "text-black font-bold"
              : "text-gray-500"
              }`}
          >
            Published
          </button>
        </div>
        {activeTab === "drafts" && (
          <div className="w-full border border-gray-300 rounded-md mt-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="p-4 flex items-center border-b border-gray-300 gap-4">
                <div>
                  <Image
                    src={draft.cover_image || "/placeholder.png"}
                    width={120}
                    height={90}
                    alt={draft.title}
                    className="object-cover rounded"
                  />
                </div>

                <div>
                  <p className="font-creato text-[18px] text-black font-medium">{draft.title}</p>
                  <p className="font-creato text-[12px] text-gray-500">{new Date(draft.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}</p>
                </div>

                <div className="ml-auto  relative">
                  <button className="cursor-pointer">
                    <EllipsisHorizontalIcon className="w-[18px] h-[18px] text-gray-600 hover:text-black" />
                  </button>
                  {activeMenu === draft.id && (
                    <div className="absolute right-0 top-8 w-44 bg-white border border-gray-300 rounded  z-50">
                      <Link
                        href={`/read/${draft.slug}`}
                        className="flex px-4 py-2 text-sm gap-4  font-medium"
                        onClick={() => setActiveMenu(null)}
                      >
                        <ArrowUturnLeftIcon className="w-4 h-4" />
                        <p>Continue Writing</p>
                      </Link>

                      <button
                        onClick={() => handleDelete(draft.id)}
                        className="flex px-4 py-2 text-sm gap-4 border-t cursor-pointer border-t-gray-300  font-medium w-full text-left"
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                        <p className="text-red-400">Delete</p>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "published" && (
            <div className="mt-4">
              {loading && (
                <p className="text-sm text-gray-500">Loading Articles</p>
              )}

              <div className="w-full border border-gray-300 rounded-md mt-6">
                {publishedArticles.map((publishedArticle) => (
                  <div key={publishedArticle.id} className="p-4 flex items-center border-b border-gray-300 gap-4">
                    <div>
                      <Image
                        src={publishedArticle.cover_image || "/placeholder.png"}
                        width={120}
                        height={90}
                        alt={publishedArticle.title}
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div>
                        <p className="font-creato text-[18px] text-black font-medium">{publishedArticle.title}</p>
                        <p className="font-creato text-[12px] text-gray-500">{new Date(publishedArticle.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}</p>
                      </div>

                      <div className="relative">

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === publishedArticle.id ? null : publishedArticle.id);
                          }}
                          title="menu" className=" cursor-pointer">
                          <EllipsisHorizontalIcon className="w-[18px] h-[18px] text-gray-600 hover:text-black" />
                        </button>
                        {activeMenu === publishedArticle.id && (
                          <div className="absolute right-0 top-8 w-44 bg-white border border-gray-300 rounded  z-50">
                            <Link
                              href={`/read/${publishedArticle.slug}`}
                              className="flex px-4 py-2 text-sm gap-4  font-medium"
                              onClick={() => setActiveMenu(null)}
                            >
                              <ArrowTrendingUpIcon className="w-4 h-4 text-gray-500" /> <p className="text-gray-500">Stats</p>
                            </Link>
                            <Link
                              href={`/read/${publishedArticle.slug}`}
                              className="flex px-4 py-2 text-sm gap-4  font-medium border-b border-gray-300"
                              onClick={() => setActiveMenu(null)}
                            >
                              <PiShareFatThin className="w-4 h-4 text-gray-500" /> <p className="text-gray-500">Share</p>
                            </Link>
                            <Link
                              href={`/read/${publishedArticle.slug}`}
                              className="flex px-4 py-2 text-sm gap-4  font-medium"
                              onClick={() => setActiveMenu(null)}
                            >
                              <ArrowUturnLeftIcon className="w-4 h-4 text-red-500" /> <p className="text-red-500">Unplublish</p>
                            </Link>
                            <Link
                              href={`/read/${publishedArticle.slug}`}
                              className="flex px-4 py-2 text-sm gap-4  font-medium"
                              onClick={() => setActiveMenu(null)}
                            >
                              <TrashIcon className="w-4 h-4 text-red-500" /> <p className="text-red-500">Delete</p>
                            </Link>


                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default page;