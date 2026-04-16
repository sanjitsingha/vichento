import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const useUserActions = (user) => {
    const [likes, setLikes] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("likes");
            return stored ? new Set(JSON.parse(stored)) : new Set();
        }
        return new Set();
    });

    const [bookmarks, setBookmarks] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("bookmarks");
            return stored ? new Set(JSON.parse(stored)) : new Set();
        }
        return new Set();
    });

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
            // ✅ sync localStorage
            localStorage.setItem(
                "likes",
                JSON.stringify(likeData?.map((l) => l.article_id) || [])
            );

            localStorage.setItem(
                "bookmarks",
                JSON.stringify(bookmarkData?.map((b) => b.article_id) || [])
            );
        };

        fetchActions();
    }, [user]);

    /* ================= ACTIONS ================= */

    const toggleLike = async (articleId) => {
        if (!user) return;

        const alreadyLiked = likes.has(articleId);

        // ⚡ 1. INSTANT UI UPDATE
        setLikes((prev) => {
            const newSet = new Set(prev);
            if (alreadyLiked) {
                newSet.delete(articleId);
            } else {
                newSet.add(articleId);
            }
            // ✅ update localStorage
            localStorage.setItem("likes", JSON.stringify([...newSet]));
            return newSet;
        });

        // ⚡ 2. BACKGROUND API CALL
        if (alreadyLiked) {
            const { error } = await supabase
                .from("likes")
                .delete()
                .eq("user_id", user.id)
                .eq("article_id", articleId);

            if (error) {
                console.error("UNLIKE ERROR:", error);
            }
        } else {
            const { error } = await supabase.from("likes").insert([
                {
                    user_id: user.id,
                    article_id: articleId,
                },
            ]);

            if (error) {
                console.error("LIKE ERROR:", error);
            }
        }
    };

    const toggleBookmark = async (articleId) => {
        if (!user) return;

        const alreadyBookmarked = bookmarks.has(articleId);

        // ⚡ INSTANT UI
        setBookmarks((prev) => {
            const newSet = new Set(prev);
            if (alreadyBookmarked) {
                newSet.delete(articleId);
            } else {
                newSet.add(articleId);
            }
            // ✅ update localStorage
            localStorage.setItem("bookmarks", JSON.stringify([...newSet]));

            return newSet;
        });

        // ⚡ BACKGROUND API
        if (alreadyBookmarked) {
            const { error } = await supabase
                .from("bookmarks")
                .delete()
                .eq("user_id", user.id)
                .eq("article_id", articleId);

            if (error) console.error(error);
        } else {
            const { error } = await supabase.from("bookmarks").insert([
                {
                    user_id: user.id,
                    article_id: articleId,
                },
            ]);

            if (error) console.error(error);
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