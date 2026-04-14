"use client";
import React, { useEffect, useState } from "react";
import { IoBookmark } from "react-icons/io5";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

const Page = () => {
  const { user } = useAuthContext();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

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
            author_id,
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
                <div className="w-full h-fit p-4 flex">

                  {/* Thumbnail placeholder */}
                  <div className="hidden md:block w-40 h-20 bg-gray-100 rounded"></div>

                  <div className="flex w-full flex-1 items-center ml-4">
                    <div className="grow">

                      {/* Title */}
                      <h1 className="font-creato text-[18px] text-black">
                        {item.articles?.title}
                      </h1>

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
                    <div className="flex gap-6 px-6 w-fit">
                      <Link
                        href={`/article/${item.article_id}`}
                        className="hover:bg-gray-300 rounded-full p-2 transition"
                      >
                        <ArrowUpRightIcon className="w-[18px] h-[18px] text-gray-400 hover:text-black" />
                      </Link>
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