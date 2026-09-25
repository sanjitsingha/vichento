"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatDate, readingTime } from "@/lib/articleUtils";
import Avatar from "@/app/components/ui/Avatar";

/* Abstract "ink & paper" illustration — Vichento's twist on the Medium hero art. */
function HeroArt() {
  return (
    <svg
      viewBox="0 0 460 520"
      className="h-auto w-full max-w-[460px]"
      aria-hidden
      fill="none"
    >
      {/* paper sheets */}
      <rect x="120" y="70" width="250" height="330" rx="6" fill="#f4f1ec" transform="rotate(8 245 235)" />
      <rect x="95" y="90" width="250" height="330" rx="6" fill="#fff" stroke="#e5e5e5" />
      {/* text lines */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect
          key={i}
          x="125"
          y={150 + i * 26}
          width={i === 0 ? 150 : i % 3 === 2 ? 120 : 190}
          height={i === 0 ? 14 : 6}
          rx="3"
          fill={i === 0 ? "#111" : "#d4d4d4"}
        />
      ))}
      {/* ink sun */}
      <circle cx="330" cy="120" r="78" fill="#dc3d24" />
      <circle cx="330" cy="120" r="78" stroke="#111" strokeWidth="1.5" strokeDasharray="4 6" transform="translate(14 12)" />
      {/* pen stroke */}
      <path
        d="M40 470 C 120 400, 190 500, 260 440 S 400 420, 440 470"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="60" cy="330" r="22" fill="#232b2b" />
      <circle cx="400" cy="380" r="10" fill="#dc3d24" />
    </svg>
  );
}

function Trending() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    supabase
      .from("articles")
      .select("id, title, slug, content, created_at, users ( name, avatar )")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(6)
      .then(({ data }) => setPosts(data || []));
  }, []);

  if (!posts.length) return null;

  return (
    <section className="border-b border-black/10">
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-10 lg:px-0">
        <p className="mb-8 flex items-center gap-2 text-sm font-medium text-black">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          Trending on Vichento
        </p>
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Link key={post.id} href={`/read/${post.slug}`} className="group flex gap-4">
              <span className="font-creato text-3xl font-bold leading-none text-black/15">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Avatar src={post.users?.avatar} name={post.users?.name} size={20} />
                  <span className="truncate text-[13px] text-gray-700">
                    {post.users?.name}
                  </span>
                </div>
                <h3 className="mt-2 line-clamp-2 font-creato text-base font-bold leading-snug text-black group-hover:underline">
                  {post.title}
                </h3>
                <p className="mt-2 text-[13px] text-gray-500">
                  {formatDate(post.created_at)} · {readingTime(post.content)} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  ["Help", "/report-bug"],
  ["Early access", "/early-access"],
  ["Privacy", "/privacy-policy"],
  ["Terms", "/terms-and-conditions"],
];

const LandingPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-[#fbfaf7]">
      {/* HERO */}
      <section className="flex flex-1 items-center border-b border-black/10">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 items-center gap-10 px-4 py-16 md:px-10 lg:grid-cols-[1.2fr_1fr] lg:px-0 lg:py-0">
          <div className="animate-fade-up">
            <h1
              className="
                font-creato font-semibold text-black
                text-[48px] leading-[1]
                md:text-[72px]
                lg:text-[100px]
                tracking-tight
              "
            >
              Built on <br /> stories & ideas
            </h1>

            <p className="mt-6 max-w-md font-creato text-[18px] text-gray-700 md:text-[20px] lg:mt-10 lg:text-[22px]">
              A space for thoughtful reading and meaningful writing
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 lg:mt-12">
              <Link
                className="rounded-full bg-black px-8 py-3 text-base text-white transition-colors hover:bg-gray-800"
                href="/signup"
              >
                Start reading
              </Link>
              <Link
                className="rounded-full px-2 py-3 text-base text-black underline-offset-4 hover:underline"
                href="/signin"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="hidden justify-end lg:flex lg:py-10">
            <HeroArt />
          </div>
        </div>
      </section>

      <Trending />

      {/* FOOTER */}
      <footer className="w-full">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-6 md:justify-between md:px-10 lg:px-0">
          <p className="hidden text-[13px] text-gray-500 md:block">
            © {new Date().getFullYear()} Vichento
          </p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-[13px] text-gray-500 transition-colors hover:text-black"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
