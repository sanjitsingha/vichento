"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { formatDate, readingTime } from "@/lib/articleUtils";
import Avatar from "./ui/Avatar";

const Header = ({ showAll }) => (
  <div className="mb-4 flex items-center justify-between">
    <p className="font-creato text-[16px] font-bold text-black">Saved stories</p>
    {showAll && (
      <Link href="/library" className="text-sm text-gray-500 hover:text-black">
        See all
      </Link>
    )}
  </div>
);

const YourReadingLIst = () => {
  const { user } = useAuthContext();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookmarks")
        .select(
          `
          id,
          articles (
            id,
            title,
            slug,
            content,
            created_at,
            users!fk_author (
              id,
              name,
              avatar
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setBookmarks(data.filter((b) => b.articles));
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, [user]);

  if (loading) {
    return (
      <div className="w-full">
        <Header />
        <div className="space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-1/3 rounded shimmer" />
              <div className="h-4 w-full rounded shimmer" />
              <div className="h-4 w-2/3 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="w-full">
        <Header />
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm leading-relaxed text-gray-600">
            Tap the bookmark icon on any story to save it here and read it later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Header showAll />

      <div className="flex flex-col gap-5">
        {bookmarks.map(({ id, articles: a }) => (
          <div key={id} className="group">
            <div className="mb-1.5 flex items-center gap-2">
              <Avatar src={a.users?.avatar} name={a.users?.name} size={20} />
              <p className="truncate text-[13px] text-gray-600">
                {a.users?.name || "Unknown"}
              </p>
            </div>

            <Link href={`/read/${a.slug}`}>
              <p className="line-clamp-2 font-creato text-[15px] font-bold leading-snug text-gray-900 decoration-gray-400 group-hover:underline">
                {a.title}
              </p>
            </Link>

            <p className="mt-1 text-[12px] text-gray-500">
              {formatDate(a.created_at)}
              <span className="mx-1">·</span>
              {readingTime(a.content)} min read
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YourReadingLIst;
