"use client";

import { useEffect, useState } from "react";
import StoriesCard from "./StoriesCard";
import { supabase } from "@/lib/supabaseClient";

export default function RelatedArticles({ categories, currentId, authorId }) {
  const [posts, setPosts] = useState([]);
  const categoryKey = (categories || []).join("|");

  useEffect(() => {
    if (!currentId) return;
    const cats = categoryKey ? categoryKey.split("|") : [];

    const fetchRelated = async () => {
      let query = supabase
        .from("articles")
        .select(
          `
            *,
            users (
              name,
              avatar
            )
          `,
        )
        .eq("status", "published")
        .neq("id", currentId)
        .order("updated_at", { ascending: false })
        .limit(4);

      if (cats.length) query = query.overlaps("categories", cats);
      else if (authorId) query = query.eq("author_id", authorId);

      const { data, error } = await query;

      if (error) {
        console.error("Related fetch failed", error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    };

    fetchRelated();
  }, [categoryKey, currentId, authorId]);

  if (!posts.length) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-8 font-creato text-xl font-bold text-black">
        More stories you might like
      </h2>
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
        {posts.map((post) => (
          <StoriesCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
