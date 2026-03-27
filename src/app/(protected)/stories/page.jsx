"use client";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import { TbDots } from "react-icons/tb";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import Modal from "@/app/components/ui/Modal";
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

  useEffect(() => {
    if (!user?.$id) return;

    const fetchDrafts = async () => {
      try {
        const response = await databases.listDocuments(
          "693d3d220017a846a1c0", // DATABASE ID
          "drafts", // COLLECTION ID
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
      if (!user?.$id) return;

      try {
        const response = await databases.listDocuments(
          "693d3d220017a846a1c0", // DATABASE ID
          "articles", // COLLECTION ID
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
        "693d3d220017a846a1c0", // DATABASE ID
        "drafts", // COLLECTION ID
        selectedDraftId
      );

      // Update UI instantly (no reload)
      setDrafts((prev) =>
        prev.filter((draft) => draft.$id !== selectedDraftId)
      );

      // Cleanup
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
        "693d3d220017a846a1c0", // DATABASE ID
        "drafts", // COLLECTION ID
        selectedDraftId
      );

      // Update UI instantly (no reload)
      setDrafts((prev) =>
        prev.filter((draft) => draft.$id !== selectedDraftId)
      );

      // Cleanup
      setDeleteDraftModal(false);
      setSelectedDraftId(null);
    } catch (error) {
      console.error("Delete draft error:", error);
      alert("Failed to delete draft");
    }
  };
  console.log(publishedArticles);

  return (
    <div className="w-full">
      <div className="max-w-[800px] mx-auto pt-10">
        <p className="text-[24px] tracking-tight font-creato">Stories</p>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 flex gap-6">
          <button
            onClick={() => setActiveTab("drafts")}
            className={`pb-2 text-[14px] ${activeTab === "drafts"
                ? "text-black border-b-2 border-black"
                : "text-gray-500"
              }`}
          >
            Drafts
          </button>

          <button
            onClick={() => setActiveTab("published")}
            className={`pb-2 text-[14px] ${activeTab === "published"
                ? "text-black border-b-2 border-black"
                : "text-gray-500"
              }`}
          >
            Published
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === "drafts" && (
            <div className="mt-4">
              {loading && (
                <p className="text-sm text-gray-500">Loading drafts…</p>
              )}

              {!loading && drafts.length === 0 && (
                <p className="text-sm text-gray-500">
                  You don’t have any drafts yet.
                </p>
              )}

              <div className="flex flex-col divide-y divide-gray-200">
                {drafts.map((draft) => (
                  <div
                    key={draft.$id}
                    className=" flex justify-between px-2 rounded"
                  >
                    <div>
                      <p className="text-[17px] font-medium">
                        {draft.title || "Untitled"}
                      </p>

                      <p className="text-[12px] text-gray-500 mt-1">
                        Last edited{" "}
                        {new Date(draft.$updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <Link href={`/write/${draft.$id}`} className="cursor-pointer border-r pr-6 border-gray-300">
                        <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedDraftId(draft.$id);
                          setDeleteDraftModal(true);
                        }}
                        className="cursor-pointer"
                      >
                        <TrashIcon className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "published" && (
            <div className="mt-4">
              {loading && (
                <p className="text-sm text-gray-500">Loading Articles</p>
              )}

              {/* {!loading && drafts.length === 0 && (
                  <p className="text-sm text-gray-500">
                    You don’t have any drafts yet.
                  </p>
                )} */}

              <div className="flex flex-col divide-y divide-gray-200">
                {publishedArticles.map((article) => (
                  <div
                    key={article.$id}
                    className=" flex justify-between px-2 rounded"
                  >
                    <div>
                      <p className="text-[17px] font-medium">
                        {article.title || "Untitled"}
                      </p>

                      <p className="text-[12px] text-gray-500 mt-1">
                        Last edited{" "}
                        {new Date(article.$updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-6 items-center">
                      <Link
                        href={`/read/${article.slug}`}
                        className="text-sm text-blue-600 border-r pr-6 border-gray-300"
                      >
                        View
                      </Link>
                      <Link href={`/write/${article.$id}?type=published`} className="cursor-pointer border-r pr-6 border-gray-300">
                        <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedDraftId(article.$id);
                          setDeleteDraftModal(true);
                        }}
                        className="cursor-pointer"
                      >
                        <TrashIcon className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal open={deleteDraftModal} onOpenChange={setDeleteDraftModal}>
        <h2 className="text-[16px] mb-4">Delete Draft</h2>
        <p className="text-[14px] text-black/60">
          Clicking delete will permanently remove this draft. This action cannot
          be undone.
        </p>
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => setDeleteDraftModal(false)}
            className="px-4 py-1 rounded"
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 bg-red-600 rounded text-white "
            onClick={handleDeleteDraft}
          >
            Delete
          </button>
        </div>
      </Modal>
      <Modal open={deletePublishedModal} onOpenChange={setDeletePublishedModal}>
        <h2 className="text-[16px] mb-4">Delete Draft</h2>
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
            className="px-4 py-1 bg-red-600 rounded text-white "
            onClick={handleDeleteDraft}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default page;
