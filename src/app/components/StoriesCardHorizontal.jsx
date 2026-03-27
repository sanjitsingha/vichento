"use client";
import { PiSparkle } from "react-icons/pi";
import { PiSparkleFill } from "react-icons/pi";
import Link from "next/link";
import { RiFireLine } from "react-icons/ri";
import { storage } from "@/lib/appwrite";
import { IoIosShareAlt } from "react-icons/io";
import { IoBookmarkOutline } from "react-icons/io5";
import { IoBookmark } from "react-icons/io5";
import { databases } from "@/lib/appwrite";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
const BUCKET_ID = "article-images";
export default function StoriesCardHorizontal({
  article,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
}) {
  const { user } = useAuthContext();

  const getImageUrl = (fileId) =>
    fileId ? storage.getFileView(BUCKET_ID, fileId).toString() : null;

  const imageUrl = getImageUrl(article.featuredImage);
  const avatarUrl =
    user?.$id === article.authorId && user?.prefs?.avatar
      ? getImageUrl(user.prefs.avatar)
      : getImageUrl(article.authorAvatar); // fallback for others

  return (
    <div className="border-b border-gray-200 pb-8 mb-8">
      {/* Author */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
          {avatarUrl && <img src={avatarUrl} alt="" />}
        </div>
        <p>{user?.$id === article.authorId ? user.name : article.authorName}</p>

        <span>·</span>
        <p>{new Date(article.$updatedAt).toDateString()}</p>
      </div>

      {/* Content */}
      <Link href={`/read/${article.slug}`}>
        <div className="flex gap-2 mt-2 cursor-pointer">
          <div className="flex-1">
            <h2
              className="
    text-[16px] md:text-[22px]
  
    
    font-creato 
    line-clamp-2 md:line-clamp-none
  "
            >
              {article.title}
            </h2>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {article.content.replace(/<[^>]*>/g, "").slice(0, 220)}…
            </p>
          </div>

          {imageUrl && (
            <img
              src={imageUrl}
              alt={article.title}
              className="w-[130px] h-[70px] md:w-[180px] md:h-[120px] object-cover rounded"
            />
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex gap-8 mt-2 text-gray-500">
        <button
          onClick={() => onLike(article.$id)} // later rename to onSpark
          className="cursor-pointer transition-transform active:scale-95"
          title="Spark this post"
        >
          {isLiked ? (
            <PiSparkleFill size={20} className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
          ) : (
            <PiSparkle
              size={20}
              className="text-gray-500 hover:text-yellow-400 transition-colors"
            />
          )}
        </button>



        <button
          onClick={() => onBookmark(article.$id)}
          className="cursor-pointer"
        >
          {isBookmarked ? (
            <IoBookmark size={18} className="text-green-700" />
          ) : (
            <IoBookmarkOutline size={18} className="text-gray-500 hover:text-green-700" />
          )}
        </button>
      </div>
    </div>
  );
}
