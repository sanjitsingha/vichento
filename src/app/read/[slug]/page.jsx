"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HTMLReactParser from "html-react-parser";
import { IoArrowRedoOutline, IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useUserActions from "@/hooks/useUserActions";
import { PiThumbsDown, PiThumbsDownFill, PiThumbsUp, PiThumbsUpFill } from "react-icons/pi";
import Image from "next/image";
import { TbBookmarks, TbBookmarksFilled } from "react-icons/tb";
import { AiFillLike, AiOutlineLike, AiFillDislike, AiOutlineDislike } from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import { PiArrowBendDoubleUpRight } from "react-icons/pi";
import { PiSealWarningLight } from "react-icons/pi";
import { RxShare2 } from "react-icons/rx";





export default function ReadArticlePage() {
  const { slug } = useParams();
  const { user } = useAuthContext();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const { likes, bookmarks, toggleLike, toggleBookmark } =
    useUserActions(user);
  const isLiked = likes.has(article?.id);
  const isBookmarked = bookmarks.has(article?.id);

  const isAuthor = user?.id === article?.author_id;





  const [activeMenu, setActiveMenu] = useState(null);
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);


  /* ---------------- FETCH ARTICLE ---------------- */
  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select(`
            *,
            users (
              name,
              avatar
            )
          `)
          .eq("slug", slug)
          .single();

        if (error) throw error;

        setArticle(data);
      } catch (err) {
        console.error("Fetch article failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  /* ================= VIEW TRACKING (OPTIMIZED) ================= */
  useEffect(() => {
    if (!article?.id) return;

    const trackView = async () => {
      const storageKey = `viewed_${article.id}`;

      // ✅ prevent duplicate (guest + session)
      const alreadyViewed = localStorage.getItem(storageKey);
      if (alreadyViewed) return;

      // ✅ mark instantly (optimistic)
      localStorage.setItem(storageKey, "true");

      const { error } = await supabase.from("views").insert([
        {
          article_id: article.id,
          user_id: user?.id || null,
        },
      ]);

      // ignore duplicate error
      if (error && error.code !== "23505") {
        console.error("VIEW ERROR:", error);
      }
    };

    trackView();
  }, [article?.id]);

  /* ---------------- SHARE ---------------- */
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  };

  // console.log(article)


  const avatar = article?.users.avatar;
  /* ---------------- LOADING ---------------- */
  if (loading) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  if (!article)
    return (
      <div>
        <p className="text-center text-black font-bold text-3xl mt-20">
          Article not found
        </p>
        <Link
          href="/explore"
          className="text-gray-600 mx-auto w-fit mt-3 block hover:underline"
        >
          Back to Explore
        </Link>
      </div>
    );

  const imageUrl = article.cover_image || null;

  return (
    <div className="max-w-[800px] p-4 md:p-0 mx-auto pt-2">
      <h1 className="text-2xl md:text-[34px] font-creato font-semibold text-black my-8">
        {article.title}
      </h1>

      <p className="text-lg font-creato  text-black/60">
        {article.meta_description}
      </p>

      {/* AUTHOR */}
      <div className="flex justify-between mt-8 mb-6">
        <div className="text-gray-500 text-sm flex gap-3  items-center">
          <Image
            src={avatar || "/placeholder.png"}
            width={30}
            height={30}
            title={article.users.name}
            alt={article.users.name}

            className="rounded-full object-cover"
          />
          <p>{article.users.name || "Author"}</p>
          <p>{new Date(article.created_at).toDateString()}</p>
        </div>

      </div>
      <div className="w-full h-10 gap-4 flex justify-start items-center">
        <div className="flex items-center bg-white px-4 border border-gray-200 h-10 rounded-full gap-2">
          <button
            title="like"
            onClick={() => onLike(article.id)}
            className="cursor-pointer transition-transform active:scale-85 flex items-center gap-2"
          >
            <span>
              {isLiked ? (
                <AiFillLike size={23} className="text-black" />
              ) : (
                <AiOutlineLike
                  size={23}
                  className="text-gray-500 hover:text-black transition-colors"
                />

              )}
            </span>
            <p className="text-sm font-creato text-gray-500">Like</p>
          </button>



        </div>
        <div className="flex items-center bg-white px-4 border border-gray-200 h-10  rounded-full gap-2">
          <button
            title="like"
            onClick={() => onLike(article.id)}
            className="cursor-pointer transition-transform active:scale-85 flex items-center gap-2"
          >
            <span>
              <RxShare2 size={21} className="text-gray-500 hover:text-black transition-colors" />
            </span>
            <p className="text-sm font-creato text-gray-500">Share</p>
          </button>



        </div>
        <div className="flex items-center">
          <button
            title="bookmark"
            onClick={() => toggleBookmark(article.id)}
            className="cursor-pointer transition-transform hidden md:flex h-10 px-3 items-center gap-2 border border-gray-200 bg-white rounded-full active:scale-85"
          >
            <span>
              {isBookmarked ? (
                <TbBookmarksFilled size={23} className="text-gray-500" />
              ) : (
                <TbBookmarks
                  size={23}
                  className="text-gray-500 transition-colors"
                />
              )}
            </span>
            <p className="text-sm font-creato text-gray-500">Save</p>
          </button>


          <div className="relative">
            <div className="flex items-center gap-2 md:hidden bg-white border-gray-200 px-4 h-10 border rounded-full ">
              <button className="cursor-pointer active:scale-85 hover:text-black transition-all ease-in-out duration-200 text-gray-500" title="more" onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === article.id ? null : article.id);
              }}>
                <BsThreeDots size={25} />

              </button>
              <p className="font-creato text-sm text-gray-500">More</p>
            </div>
            {activeMenu === article.id && (

              <div className="absolute animate-dropdown left-[-115px] top-12   bg-white h-80 w-60 rounded shadow-lg border-gray-300 border p-4">
                <button
                  onClick={handleShare}
                  className="cursor-pointer md:hidden text-gray-500 flex items-center gap-3"
                >
                  <AiOutlineLike size={18} />
                  <p className="font-creato text-sm"> Like</p>
                </button>
                <button
                  onClick={handleShare}
                  className="cursor-pointer md:hidden text-gray-500 flex  mt-4 items-center gap-3"
                >
                  <AiOutlineDislike size={18} />
                  <p className="font-creato text-sm"> Dislike</p>
                </button>
                <button
                  onClick={handleShare}
                  className="cursor-pointer text-gray-500 flex md:mt-0 mt-4  items-center gap-3"
                >
                  <TbBookmarks size={18} />
                  <p className="font-creato text-sm"> Save</p>
                </button>
                <button
                  onClick={handleShare}
                  className="cursor-pointer mt-4 text-red-500 flex items-center gap-3"
                >
                  <PiSealWarningLight size={18} />
                  <p className="font-creato text-sm"> Report</p>
                </button>

              </div>
            )}
          </div>

        </div>

      </div>

      {imageUrl && (
        <Image
          width={700}
          height={500}
          priority
          objectFit="cover"
          src={imageUrl}
          className="w-full rounded my-8"
          alt={article.title}
        />
      )}

      <div className="prose max-w-none font-creato text-xl text-black">
        {HTMLReactParser(article.content)}
      </div>

      {/* RELATED */}
      <div className="py-10">
        <hr className="my-6" />
        <p className="text-xl font-semibold">Related Stories</p>

        {/* <RelatedArticles
          categories={article.categories}
          currentId={article.id}
        /> */}
      </div>
    </div>
  );
}