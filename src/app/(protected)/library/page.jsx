"use client";
import React, { useEffect, useState } from "react";
import { IoBookmark } from "react-icons/io5";
import { ArrowUpRightIcon, EllipsisHorizontalIcon, BookmarkSlashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import Image from "next/image";

const Page = () => {
  const { user } = useAuthContext();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  // 🔹 Fetch Bookmarks
  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
          id,
          article_id,
          articles (
            id,
            title,
            slug,
            author_id,
            cover_image,
            created_at,
            users!fk_author (
              id,
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookmarks:", error);
      } else {
        setLibrary(data || []);
      }

      setLoading(false);
    };

    fetchBookmarks();
  }, [user]);

  console.log(library)

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleRemoveBookmark = async (bookmarkId) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (!error) {
      setLibrary((prev) => prev.filter((item) => item.id !== bookmarkId));
      setActiveMenu(null); // 👈 close dropdown
    }
  };

  // 🔹 Skeleton Component
  const Skeleton = () => (
    <div className="w-full p-4 flex animate-pulse">
      <div className="hidden md:block w-40 h-20 bg-gray-200 rounded"></div>
      <div className="flex flex-1 items-center ml-4">
        <div className="w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full md:p-0 p-4">
      <div className="mx-auto max-w-[800px] pt-6 md:pt-10">

        {/* Header */}
        <div className="w-full flex justify-between items-center pb-3 border-b border-gray-300 mb-6">
          <p className="text-[24px] tracking-tight text-black font-creato">
            Reading List
          </p>
          <IoBookmark className="text-gray-500" size={22} />
        </div>

        {/* Content Box */}
        <div className="w-full h-fit border border-gray-300 rounded-lg">

          {/* 🔹 Loading */}
          {loading && (
            <>
              <Skeleton />
              <hr className="w-full border-gray-300" />
              <Skeleton />
              <hr className="w-full border-gray-300" />
              <Skeleton />
            </>
          )}

          {/* 🔹 Empty */}
          {!loading && library.length === 0 && (
            <p className="p-6 text-gray-500 text-center">
              No bookmarks yet
            </p>
          )}

          {/* 🔹 Data */}
          {!loading &&
            library.map((item) => (
              <div key={item.id}>
                <div className="w-full h-fit px-2 py-4 md:p-4 flex">

                  {/* Thumbnail placeholder */}
                  <div>
                    <Image
                      src={item.articles?.cover_image || "/placeholder.png"}
                      width={120}
                      height={90}
                      alt={item.articles?.title}
                      className="object-cover rounded"
                    />
                  </div>


                  <div className="flex w-full flex-1 items-center md:ml-6 ml-2">
                    <div className="grow">

                      {/* Title */}
                      <Link href={`/read/${item.articles?.slug}`} className="font-creato md:text-[20px] font-medium text-black">
                        {item.articles?.title}
                      </Link>

                      {/* Author + Date */}
                      <p className="font-creato text-[11px] text-gray-500 mt-1">
                        {item.articles?.users?.name || "Unknown"} |{" "}
                        {new Date(
                          item.articles?.created_at
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex gap-6 md:px-6 w-fit">
                      <Link
                        href={`/read/${item.articles?.slug}`}
                        className="hover:bg-gray-300 rounded-full p-2 transition hidden md:block bg-gray-200"
                      >
                        <ArrowUpRightIcon className="w-[18px] h-[18px] text-gray-600 hover:text-black" />
                      </Link>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === item.id ? null : item.id);
                          }}
                          className="p-2 bg-gray-200 rounded-full"
                        >
                          <EllipsisHorizontalIcon className="w-[20px] h-[20px] text-gray-600" />
                        </button>

                        {/* 🔥 Tooltip Menu */}
                        {activeMenu === item.id && (
                          <div className="absolute right-0 top-12 w-44 bg-white border border-gray-200 rounded-lg shadow-md z-50">

                            <Link
                              href={`/read/${item.articles?.slug}`}
                              className="block px-4 py-2 text-sm hover:bg-gray-100"
                              onClick={() => setActiveMenu(null)}
                            >
                              Share
                            </Link>

                            <button
                              onClick={() => handleRemoveBookmark(item.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500"
                            >
                              Remove Bookmark
                            </button>

                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                <hr className="w-full border-gray-300" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Page;