import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const useUserActions = (user) => {
    const [likes, setLikes] = useState(new Set());
    const [bookmarks, setBookmarks] = useState(new Set());

    /* ================= FETCH ================= */
    useEffect(() => {
        if (!user) return;

        const fetchActions = async () => {
            // Likes
            const { data: likeData } = await supabase
                .from("likes")
                .select("article_id")
                .eq("user_id", user.id);

            // Bookmarks
            const { data: bookmarkData } = await supabase
                .from("bookmarks")
                .select("article_id")
                .eq("user_id", user.id);

            setLikes(new Set(likeData?.map((l) => l.article_id)));
            setBookmarks(new Set(bookmarkData?.map((b) => b.article_id)));
        };

        fetchActions();
    }, [user]);

    /* ================= ACTIONS ================= */

    const toggleLike = async (articleId) => {
        const alreadyLiked = likes.has(articleId);

        if (alreadyLiked) {
            await supabase
                .from("likes")
                .delete()
                .eq("user_id", user.id)
                .eq("article_id", articleId);

            setLikes((prev) => {
                const newSet = new Set(prev);
                newSet.delete(articleId);
                return newSet;
            });
        } else {
            await supabase.from("likes").insert([
                {
                    user_id: user.id,
                    article_id: articleId,
                },
            ]);

            setLikes((prev) => new Set(prev).add(articleId));
        }
    };

    const toggleBookmark = async (articleId) => {
        const alreadyBookmarked = bookmarks.has(articleId);

        if (alreadyBookmarked) {
            await supabase
                .from("bookmarks")
                .delete()
                .eq("user_id", user.id)
                .eq("article_id", articleId);

            setBookmarks((prev) => {
                const newSet = new Set(prev);
                newSet.delete(articleId);
                return newSet;
            });
        } else {
            await supabase.from("bookmarks").insert([
                {
                    user_id: user.id,
                    article_id: articleId,
                },
            ]);

            setBookmarks((prev) => new Set(prev).add(articleId));
        }
    };

    return {
        likes,
        bookmarks,
        toggleLike,
        toggleBookmark,
    };
};

export default useUserActions;