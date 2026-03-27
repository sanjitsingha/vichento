"use client";
import { useEffect, useState } from "react";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";
import StoriesCard from "./StoriesCard";
import HTMLReactParser from "html-react-parser";

const DATABASE_ID = "693d3d220017a846a1c0";
const COLLECTION_ID = "articles";

export default function RelatedArticles({ categories, currentId }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!categories?.length || !currentId) return;

    const fetchRelated = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.contains("categories", [categories[0]]),
            Query.notEqual("$id", currentId),
            Query.limit(4),
          ]
        );

        setPosts(res.documents);
      } catch (err) {
        console.error("Related fetch failed", err);
      }
    };

    fetchRelated();
  }, [categories, currentId]);

  if (!posts.length) return null;

  return (
    <div className="mt-4 grid md:grid-cols-2 grid-cols-1 gap-10">
      {posts.map((post) => (
        <StoriesCard key={post.$id} post={post} />
      ))}
    </div>
  );
}
