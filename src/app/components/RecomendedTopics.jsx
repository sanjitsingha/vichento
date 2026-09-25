"use client";

import React from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

const RecomendedTopics = ({ limit = 9 }) => {
  return (
    <div className="w-full">
      <p className="mb-4 font-creato font-bold text-black">Recommended topics</p>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.slice(0, limit).map((cat) => (
          <Link
            key={cat}
            href={`/explore?category=${encodeURIComponent(cat)}`}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 hover:text-black"
          >
            {cat}
          </Link>
        ))}
      </div>

      <Link
        href="/explore"
        className="mt-4 inline-block text-sm text-gray-500 transition-colors hover:text-black"
      >
        See more topics
      </Link>
    </div>
  );
};

export default RecomendedTopics;
