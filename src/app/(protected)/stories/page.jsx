"use client";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { Query } from "appwrite";
import { databases, storage } from "@/lib/appwrite";
import { TbDots } from "react-icons/tb";
import {
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/app/components/ui/Modal";
const BUCKET_ID = "article-images";
import Link from "next/link";

const page = () => {
  const [activeTab, setActiveTab] = useState("drafts");
  const { user } = useAuthContext();
  const [drafts, setDrafts] = useState([]);
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [deleteDraftModal, setDeleteDraftModal] = useState(false);
  const [deletePublishedModal, setDeletePublishedModal] = useState(false);

  // ✅ NEW STATE (for mobile menu)
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!user?.$id) return;

    const fetchDrafts = async () => {
      try {
        const response = await databases.listDocuments(
          "693d3d220017a846a1c0",
          "drafts",
          [Query.equal("authorId", [user.$id]), Query.orderDesc("$updatedAt")]
        );
        setDrafts(response.documents);
      } catch (error) {
        console.error("Error fetching drafts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [user?.$id]);

  useEffect(() => {
    if (!user?.$id) return;

    const fetchPublishedArticles = async () => {
      try {
        const response = await databases.listDocuments(
          "693d3d220017a846a1c0",
          "articles",
          [
            Query.equal("authorId", [user.$id]),
            Query.equal("status", "published"),
            Query.orderDesc("$updatedAt"),
          ]
        );
        setPublishedArticles(response.documents);
      } catch (error) {
        console.error("Error fetching published articles:", error);
      }
    };

    fetchPublishedArticles();
  }, [user?.$id]);

  const handleDeleteDraft = async () => {
    if (!selectedDraftId) return;

    try {
      await databases.deleteDocument(
        "693d3d220017a846a1c0",
        "drafts",
        selectedDraftId
      );

      setDrafts((prev) =>
        prev.filter((draft) => draft.$id !== selectedDraftId)
      );

      setDeleteDraftModal(false);
      setSelectedDraftId(null);
    } catch (error) {
      console.error("Delete draft error:", error);
      alert("Failed to delete draft");
    }
  };

  const handleDeletePublished = async () => {
    if (!selectedDraftId) return;

    try {
      await databases.deleteDocument(
        "693d3d220017a846a1c0",
        "articles",
        selectedDraftId
      );

      setPublishedArticles((prev) =>
        prev.filter((item) => item.$id !== selectedDraftId)
      );

      setDeletePublishedModal(false);
      setSelectedDraftId(null);
    } catch (error) {
      console.error("Delete published error:", error);
      alert("Failed to delete article");
    }
  };

  const getImageUrl = (fileId) =>
    fileId ? storage.getFileView(BUCKET_ID, fileId).toString() : null;

  // ✅ close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="w-full p-4 md:p-0">
      <div className="max-w-[800px] mx-auto pt-10">
        <p className="text-[24px] text-black tracking-tight font-creato">Stories</p>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 flex gap-6">
          <button
            onClick={() => setActiveTab("drafts")}
            className={`pb-2 text-[14px] ${
              activeTab === "drafts"
                ? "text-black border-b-2 border-black"
                : "text-gray-500"
            }`}
          >
            Drafts
          </button>

          <button
            onClick={() => setActiveTab("published")}
            className={`pb-2 text-[14px] ${
              activeTab === "published"
                ? "text-black border-b-2 border-black"
                : "text-gray-500"
            }`}
          >
            Published
          </button>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "published" && (
            <div className="mt-4">
              {loading && (
                <p className="text-sm text-gray-500">Loading Articles</p>
              )}

              <div className="flex flex-col divide-y divide-gray-200">
                {publishedArticles.map((article) => {
                  const imageUrl = getImageUrl(article.featuredImage);

                  return (
                    <div
                      key={article.$id}
                      className="flex items-center justify-between md:px-2  py-3 rounded"
                    >
                      {/* LEFT */}
                      <div className="flex items-center gap-4">
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt="thumbnail"
                            className="w-20 h-16 object-cover rounded-lg"
                          />
                        )}

                        <div>
                          <p className="text-[17px] line-clamp-1 font-medium">
                            {article.title || "Untitled"}
                          </p>

                          <p className="text-[12px] text-gray-500 mt-1">
                            Last edited{" "}
                            {new Date(
                              article.$updatedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex items-center">
                        {/* DESKTOP */}
                        <div className="hidden md:flex gap-6 items-center">
                          <Link
                            href={`/read/${article.slug}`}
                            className="border-r pr-6 border-gray-300"
                          >
                            <EyeIcon className="size-5" />
                          </Link>

                          <Link
                            href={`/write/${article.$id}?type=published`}
                            className="cursor-pointer border-r pr-6 border-gray-300"
                          >
                            <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                          </Link>

                          <button
                            onClick={() => {
                              setSelectedDraftId(article.$id);
                              setDeletePublishedModal(true);
                            }}
                          >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                          </button>
                        </div>

                        {/* MOBILE */}
                        <div className="relative md:hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === article.$id
                                  ? null
                                  : article.$id
                              );
                            }}
                          >
                            <TbDots className="w-6 h-6 rotate-90 text-gray-600" />
                          </button>

                          {openMenuId === article.$id && (
                            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-md z-50">
                              <Link
                                href={`/read/${article.slug}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                <EyeIcon className="w-4 h-4" />
                                View
                              </Link>

                              <Link
                                href={`/write/${article.$id}?type=published`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Edit
                              </Link>

                              <button
                                onClick={() => {
                                  setSelectedDraftId(article.$id);
                                  setDeletePublishedModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-100"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      <Modal open={deletePublishedModal} onOpenChange={setDeletePublishedModal}>
        <h2 className="text-[16px] mb-4">Delete Story</h2>
        <p className="text-[14px] text-black/60">
          Clicking delete will permanently remove this story. This action cannot
          be undone.
        </p>
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => setDeletePublishedModal(false)}
            className="px-4 py-1 rounded"
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 bg-red-600 rounded text-white"
            onClick={handleDeletePublished}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default page;