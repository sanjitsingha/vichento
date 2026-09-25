import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { buildAnalyticsPayload } from "@/lib/analyticsHelpers";

const readSet = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const writeSet = (key, set) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
};

const toggleInSet = (set, id, on) => {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
};

const useUserActions = (user) => {
  const [likes, setLikes] = useState(() =>
    typeof window !== "undefined" ? readSet("likes") : new Set(),
  );
  const [bookmarks, setBookmarks] = useState(() =>
    typeof window !== "undefined" ? readSet("bookmarks") : new Set(),
  );

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!user) return;

    const fetchActions = async () => {
      const [{ data: likeData }, { data: bookmarkData }] = await Promise.all([
        supabase.from("likes").select("article_id").eq("user_id", user.id),
        supabase.from("bookmarks").select("article_id").eq("user_id", user.id),
      ]);

      const nextLikes = new Set((likeData || []).map((l) => l.article_id));
      const nextBookmarks = new Set((bookmarkData || []).map((b) => b.article_id));
      setLikes(nextLikes);
      setBookmarks(nextBookmarks);
      writeSet("likes", nextLikes);
      writeSet("bookmarks", nextBookmarks);
    };

    fetchActions();
  }, [user]);

  /* ================= ACTIONS ================= */

  // Optimistic toggle against a (user_id, article_id) table; reverts on failure.
  const toggle = useCallback(
    async (table, key, current, setState, articleId) => {
      if (!user) return false;
      const wasOn = current.has(articleId);

      setState((prev) => {
        const next = toggleInSet(prev, articleId, !wasOn);
        writeSet(key, next);
        return next;
      });

      let error;
      if (wasOn) {
        ({ error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId));
      } else {
        const meta = await buildAnalyticsPayload();
        ({ error } = await supabase
          .from(table)
          .insert([{ user_id: user.id, article_id: articleId, ...meta }]));
      }

      if (error) {
        console.error(`${table} toggle failed:`, error);
        setState((prev) => {
          const next = toggleInSet(prev, articleId, wasOn);
          writeSet(key, next);
          return next;
        });
        return false;
      }
      return true;
    },
    [user],
  );

  const toggleLike = useCallback(
    (articleId) => toggle("likes", "likes", likes, setLikes, articleId),
    [toggle, likes],
  );

  const toggleBookmark = useCallback(
    (articleId) =>
      toggle("bookmarks", "bookmarks", bookmarks, setBookmarks, articleId),
    [toggle, bookmarks],
  );

  return {
    likes,
    bookmarks,
    toggleLike,
    toggleBookmark,
  };
};

export default useUserActions;
