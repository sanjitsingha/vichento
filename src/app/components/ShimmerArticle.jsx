import React from "react";

const ShimmerArticle = () => {
  return (
    <div className="border-b border-gray-100 py-8 first:pt-2" aria-hidden>
      {/* Author */}
      <div className="flex items-center gap-2">
        <div className="h-[22px] w-[22px] rounded-full shimmer" />
        <div className="h-3 w-28 rounded shimmer" />
      </div>

      {/* Content */}
      <div className="mt-4 flex gap-6 sm:gap-10">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-4/5 rounded shimmer" />
          <div className="h-4 w-full rounded shimmer" />
          <div className="hidden h-4 w-2/3 rounded shimmer sm:block" />
        </div>
        <div className="h-[56px] w-[80px] rounded-sm shimmer sm:h-[107px] sm:w-[160px]" />
      </div>

      {/* Meta */}
      <div className="mt-4 flex justify-between">
        <div className="h-3 w-32 rounded shimmer" />
        <div className="h-3 w-20 rounded shimmer" />
      </div>
    </div>
  );
};

export default ShimmerArticle;
