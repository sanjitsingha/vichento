"use client";
import { useRef, useState } from "react";
import JoditEditor from "jodit-react";
import LoadingBar from "react-top-loading-bar";
import {
  ArrowTurnRightUpIcon,
  ChevronDownIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { databases, ID, storage } from "@/lib/appwrite";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { GoChevronRight } from "react-icons/go";
import { MdArrowOutward } from "react-icons/md";
import { useRouter } from "next/navigation";

export default function WritePage() {
  const loadingBarRef = useRef(null);

  const { user } = useAuthContext();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [shortDescription, setshortdescription] = useState("")
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

  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= 5) return prev; // optional max
      return [...prev, category];
    });
  };

  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    try {
      // Upload image to Appwrite
      const uploadedFile = await storage.createFile(
        "article-images", // BUCKET ID
        ID.unique(),
        file
      );

      // Get preview URL
      const imageUrl = storage
        .getFileView(
          "article-images", // BUCKET ID
          uploadedFile.$id
        )
        .toString();

      setFeaturedImage(uploadedFile.$id);
      setFeaturedImageUrl(imageUrl);
      console.log("Uploaded image URL:", imageUrl);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload image");
    }
  };

  const saveDraft = async () => {
    try {
      await databases.createDocument(
        "693d3d220017a846a1c0", // DATABASE ID
        "drafts", // TABLE ID
        ID.unique(),
        {
          title: title || "Untitled draft",
          content,
          shortDescription: shortDescription || "",
          authorId: user.$id,
          featuredImage: featuredImage || "",
          categories: selectedCategories,
          lastEditedAt: new Date().toISOString(),
        }
      );

      alert("Draft saved successfully");
      router.push("/stories");
    } catch (error) {
      console.error("Save draft error:", error);
      alert(error.message || "Failed to save draft");
    }
  };

  const publishArticle = async () => {
    if (selectedCategories.length < 3) {
      setCategoryError("Please select at least 3 categories");
      return;
    }
    // Implement publish logic here
    try {
      setIsPublishing(true);
      loadingBarRef.current?.continuousStart();

      await databases.createDocument(
        "693d3d220017a846a1c0", // DATABASE ID
        "articles", // TABLE ID
        ID.unique(),
        {
          title: title || "Untitled article",
          featuredImage: featuredImage || "",
          content,
          shortDescription: shortDescription || "",
          authorId: user.$id,
          authorName: user.name || "Anonymous",
          authorAvatar: user.prefs.avatar || null,
          slug: title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, ""),
          categories: selectedCategories,
          status: "published",
          views: 0,
          likes: 0,
        }
      );
      loadingBarRef.current?.complete();
      setIsPublishing(false);
      alert("Article published successfully");
    } catch (error) {
      console.error("Publish article error:", error);
      alert(error.message || "Failed to publish article");
      loadingBarRef.current?.continuousStart();
      loadingBarRef.current?.complete();
    }
  };

  return (
    <>
      <LoadingBar color="#16a34a" ref={loadingBarRef} />

      <div className="w-full max-w-[800px] text-black mx-auto pt-10">
        <div className="w-full mb-4 flex justify-between">
          <div className="  flex items-center w-full">
            <Link
              className="text-sm pb-1  w-fit flex items-center gap-1"
              href="/"
            >
              <p className="bg-yellow-500 p-1 mr-1 rounded-full text-xs"></p>
              <p className="">View drafts</p>
              <GoChevronRight size={18} />
            </Link>
          </div>
          <div className="w-full flex justify-end gap-6 items-center ">
            <button
              onClick={saveDraft}
              className="text-[14px] text-gray-500 underline  cursor-pointer  "
            >
              Save Draft
            </button>
            <button
              onClick={publishArticle}
              disabled={isPublishing}
              className={`bg-green-600 py-1.5 flex items-center gap-1 rounded-full text-white px-4
    ${isPublishing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
  `}
            >
              <p>{isPublishing ? "Publishing…" : "Published"}</p>
              <MdArrowOutward size={20} />
            </button>
          </div>
        </div>

        <div
          className={`transition-opacity duration-300 ${
            isPublishing ? "opacity-40 pointer-events-none select-none" : ""
          }`}
        >
          <input
            type="text"
            placeholder="Title"
            className="w-full text-[32px] font-serif outline-none my-6"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="w-full rounded-sm mb-8 bg-gray-100 flex justify-center items-center h-80 border border-gray-300 relative overflow-hidden">
            {!featuredImageUrl ? (
              <>
                <button onClick={() => fileInputRef.current.click()}>
                  <PlusCircleIcon className="w-12 h-12 text-gray-500 cursor-pointer" />
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFeaturedImageUpload}
                />
              </>
            ) : (
              <>
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />

                {/* Edit / Replace */}
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full"
                >
                  Edit
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFeaturedImageUpload}
                />
              </>
            )}
          </div>

          <div className="w-full mb-8"> 
          <input value={shortDescription} onChange={(e)=>setshortdescription(e.target.value)} type="textarea" placeholder="Write a short description    (optional)" className="w-full font-creato   outline-none " />
          </div>

          <JoditEditor
            ref={editor}
            value={content}
            onChange={(newContent) => setContent(newContent)}
          />

          {/* Categories */}
          <div className="my-6">
            <p className="text-sm text-gray-600 mb-2">
              Choose up to 5 categories (min 3)
            </p>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm border transition ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {selectedCategories.length} / 5 selected
            </p>

            {categoryError && (
              <p className="text-xs text-red-500 mt-1">{categoryError}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
