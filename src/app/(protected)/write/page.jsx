"use client";

import { useRef, useState } from "react";
import JoditEditor from "jodit-react";
import LoadingBar from "react-top-loading-bar";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { GoChevronRight } from "react-icons/go";
import { MdArrowOutward } from "react-icons/md";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function WritePage() {
  const loadingBarRef = useRef(null);
  const { user } = useAuthContext();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [shortDescription, setshortdescription] = useState("");
  const [content, setContent] = useState("");
  const editor = useRef(null);

  const [featuredImage, setFeaturedImage] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const fileInputRef = useRef(null);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const CATEGORIES = [
    "Technology",
    "AI",
    "Startups",
    "Business",
    "Programming",
    "Design",
    "Productivity",
    "Finance",
    "Marketing",
    "Health",
    "Career",
    "Sports",
    "Science",
    "Writing",
  ];

  // 🔥 CATEGORY TOGGLE
  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= 5) return prev;
      return [...prev, category];
    });
  };

  // 🖼️ IMAGE UPLOAD (SUPABASE STORAGE)
const handleFeaturedImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("article-images")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("article-images")
      .getPublicUrl(fileName);

    setFeaturedImage(fileName);
    setFeaturedImageUrl(publicUrlData.publicUrl);

    console.log("Uploaded:", publicUrlData.publicUrl);
  } catch (error) {
    console.error("Image upload error:", error.message);
    alert(error.message || "Upload failed");
  }
};

  // 🧠 SLUG GENERATOR
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  // 💾 SAVE DRAFT
  const saveDraft = async () => {
    try {
      const { error } = await supabase.from("articles").insert([
        {
          title: title || "Untitled draft",
          content,
          meta_description: shortDescription,
          author_id: user.id,
          cover_image: featuredImageUrl,
          categories: selectedCategories,
          status: "draft",
        },
      ]);

      if (error) throw error;

      alert("Draft saved successfully");
      router.push("/stories");
    } catch (error) {
      console.error("Save draft error:", error);
      alert(error.message);
    }
  };

  // 🚀 PUBLISH ARTICLE
  const publishArticle = async () => {
    if (selectedCategories.length < 3) {
      setCategoryError("Please select at least 3 categories");
      return;
    }

    try {
      setIsPublishing(true);
      loadingBarRef.current?.continuousStart();

      const slug = generateSlug(title);

      const { error } = await supabase.from("articles").insert([
        {
          title: title || "Untitled article",
          content,
          meta_description: shortDescription,
          slug,
          author_id: user.id,
          cover_image: featuredImageUrl,
          categories: selectedCategories,
          status: "published",
          view_count: 0,
          like_count: 0,
          bookmark_count: 0,
        },
      ]);

      if (error) throw error;

      loadingBarRef.current?.complete();
      setIsPublishing(false);

      alert("Article published successfully");
      router.push(`/read/${slug}`);
    } catch (error) {
      console.error("Publish error:", error);
      alert(error.message);
      setIsPublishing(false);
      loadingBarRef.current?.complete();
    }
  };

  return (
    <>
      <LoadingBar color="#16a34a" ref={loadingBarRef} />

      <div className="w-full max-w-[800px] text-black mx-auto pt-10">
        <div className="w-full mb-4 flex justify-between">
          <Link className="flex items-center gap-1" href="/">
            <p className="bg-yellow-500 p-1 rounded-full text-xs"></p>
            <p>View drafts</p>
            <GoChevronRight size={18} />
          </Link>

          <div className="flex gap-6 items-center">
            <button
              onClick={saveDraft}
              className="text-sm text-gray-500 underline"
            >
              Save Draft
            </button>

            <button
              onClick={publishArticle}
              disabled={isPublishing}
              className={`bg-green-600 py-1.5 flex items-center gap-1 rounded-full text-white px-4 ${
                isPublishing ? "opacity-60" : ""
              }`}
            >
              <p>{isPublishing ? "Publishing…" : "Publish"}</p>
              <MdArrowOutward size={20} />
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Title"
          className="w-full text-3xl font-serif my-6 outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* IMAGE */}
        <div className="h-80 bg-gray-100 flex justify-center items-center border relative">
          {!featuredImageUrl ? (
            <>
              <button onClick={() => fileInputRef.current.click()}>
                <PlusCircleIcon className="w-12 h-12 text-gray-500" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFeaturedImageUpload}
              />
            </>
          ) : (
            <img
              src={featuredImageUrl}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <input
          value={shortDescription}
          onChange={(e) => setshortdescription(e.target.value)}
          placeholder="Short description"
          className="w-full my-6 outline-none"
        />

        <JoditEditor
          ref={editor}
          value={content}
          onChange={(newContent) => setContent(newContent)}
        />

        {/* CATEGORIES */}
        <div className="my-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-1 rounded-full ${
                    active ? "bg-black text-white" : "bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {categoryError && (
            <p className="text-red-500 text-sm">{categoryError}</p>
          )}
        </div>
      </div>
    </>
  );
}