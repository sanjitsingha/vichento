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
    <div className="w-full pt-16">
      <p className="font-semibold mb-4 text-black font-creato">
        Your Reading List
      </p>

      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className="px-4 py-1.5 rounded-full text-sm border bg-white text-gray-700 border-gray-300 hover:border-black transition"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecomendedTopics;