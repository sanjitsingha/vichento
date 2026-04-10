import { supabase } from "@/lib/supabaseClient";

const useBookmarkActions = (user) => {

    const addBookmark = async (articleId) => {
        if (!user) return;

        const { error } = await supabase
            .from("bookmarks")
            .insert([{ user_id: user.id, article_id: articleId }]);

        if (error) console.error("Add bookmark error:", error);
    };

    const removeBookmark = async (articleId) => {
        if (!user) return;

        const { error } = await supabase
            .from("bookmarks")
            .delete()
            .eq("user_id", user.id)
            .eq("article_id", articleId);

        if (error) console.error("Remove bookmark error:", error);
    };

    const isBookmarked = async (articleId) => {
        if (!user) return false;

        const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .eq("user_id", user.id)
            .eq("article_id", articleId)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Check bookmark error:", error);
        }

        return !!data;
    };

    return {
        addBookmark,
        removeBookmark,
        isBookmarked,
    };
};

export default useBookmarkActions;