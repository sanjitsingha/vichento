"use client";

import React from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Technology",
  "Startups",
  "Design",
  "Ai",
  "Health",
  "Productivity",
  "Business",
];

const RecomendedTopics = () => {
  const router = useRouter();

  const handleClick = (category) => {
    router.push(`/explore?category=${category}`);
  };

  return (
    <div className="w-full">
      <p className="font-semibold mb-4 hidden md:block text-black font-creato">
        Your Reading List
      </p>

      <div className="flex gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm border bg-white text-gray-700 border-gray-300 hover:border-black transition"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecomendedTopics;