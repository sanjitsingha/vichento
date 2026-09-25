"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AiFillLike, AiOutlineLike } from "react-icons/ai";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/articleUtils";
import Avatar from "./ui/Avatar";
import ConfirmDialog from "./ui/ConfirmDialog";

async function loadComments(articleId) {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
        *,
        users:user_id (name, avatar, username),
        comment_likes (user_id)
      `,
    )
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (!error) return data || [];

  // Fall back to the bare rows if the joins aren't available.
  const { data: raw } = await supabase
    .from("comments")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });
  return raw || [];
}

function Composer({ placeholder, initial = "", submitLabel, onSubmit, onCancel, autoFocus }) {
  const { user, profile } = useAuthContext();
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(autoFocus || !!initial);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const ok = await onSubmit(text.trim());
    setBusy(false);
    if (ok) {
      setText("");
      if (!onCancel) setFocused(false);
    }
  };

  return (
    <div
      className={`rounded-lg transition-shadow ${
        focused ? "shadow-[0_2px_12px_rgba(0,0,0,0.1)]" : "bg-gray-50"
      } p-4`}
    >
      {focused && !initial && (
        <div className="mb-3 flex items-center gap-2">
          <Avatar src={profile?.avatar} name={profile?.name || user?.email} size={28} />
          <span className="text-sm text-black">{profile?.name || "You"}</span>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        autoFocus={autoFocus}
        rows={focused ? 3 : 1}
        maxLength={2000}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-black outline-none placeholder:text-gray-400"
      />
      {focused && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={() => {
              setText(initial);
              setFocused(false);
              onCancel?.();
            }}
            className="rounded-full px-4 py-1.5 text-sm text-gray-600 hover:text-black"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            className="rounded-full bg-black px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
          >
            {busy ? "…" : submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function ResponseItem({ comment, replies = [], depth = 0, actions }) {
  const { user } = useAuthContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const menuRef = useRef(null);

  const likedBy = comment.comment_likes || [];
  const liked = !!user && likedBy.some((l) => l.user_id === user.id);
  const isOwner = user?.id === comment.user_id;
  const author = comment.users || {};

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className={depth ? "border-l-2 border-gray-100 pl-5" : "border-b border-gray-100 py-6"}>
      <div className={depth ? "py-4" : ""}>
        <div className="flex items-start justify-between gap-3">
          <Link
            href={author.username ? `/profile/${author.username}` : "#"}
            className="flex items-center gap-3"
          >
            <Avatar src={author.avatar} name={author.name} size={32} />
            <div>
              <p className="text-sm font-medium text-black">{author.name || "Reader"}</p>
              <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
            </div>
          </Link>

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Response options"
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-black"
              >
                <HiOutlineDotsHorizontal size={18} />
              </button>
              {menuOpen && (
                <div className="animate-dropdown absolute right-0 top-8 z-10 w-36 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      actions.remove(comment.id);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-3">
            <Composer
              initial={comment.content}
              submitLabel="Update"
              autoFocus
              onCancel={() => setEditing(false)}
              onSubmit={async (text) => {
                const ok = await actions.update(comment.id, text);
                if (ok) setEditing(false);
                return ok;
              }}
            />
          </div>
        ) : (
          <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed text-gray-800">
            {comment.content}
          </p>
        )}

        <div className="mt-3 flex items-center gap-5 text-sm text-gray-500">
          <button
            onClick={() => actions.like(comment.id, liked)}
            aria-pressed={liked}
            className="flex items-center gap-1.5 hover:text-black"
          >
            {liked ? <AiFillLike size={17} className="text-black" /> : <AiOutlineLike size={17} />}
            {likedBy.length > 0 && likedBy.length}
          </button>
          {depth === 0 && (
            <button
              onClick={() => (user ? setReplying((r) => !r) : actions.requireUser())}
              className="hover:text-black"
            >
              {replies.length ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"} · ` : ""}
              Reply
            </button>
          )}
        </div>
      </div>

      {(replying || replies.length > 0) && depth === 0 && (
        <div className="mt-4 space-y-1">
          {replies.map((r) => (
            <ResponseItem key={r.id} comment={r} depth={1} actions={actions} />
          ))}
          {replying && (
            <div className="border-l-2 border-gray-100 pl-5 pt-2">
              <Composer
                placeholder={`Reply to ${author.name || "this response"}…`}
                submitLabel="Reply"
                autoFocus
                onCancel={() => setReplying(false)}
                onSubmit={async (text) => {
                  const ok = await actions.post(text, comment.id);
                  if (ok) setReplying(false);
                  return ok;
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Responses({ articleId, onCountChange }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchComments = useCallback(async () => {
    setComments(await loadComments(articleId));
  }, [articleId]);

  useEffect(() => {
    let active = true;
    loadComments(articleId).then((rows) => {
      if (!active) return;
      setComments(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [articleId]);

  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

  const requireUser = () => {
    toast("Sign in to join the conversation");
  };

  const actions = {
    requireUser,
    post: async (content, parentId = null) => {
      if (!user) {
        requireUser();
        return false;
      }
      const { error } = await supabase.from("comments").insert([
        {
          article_id: articleId,
          user_id: user.id,
          content,
          ...(parentId ? { parent_id: parentId } : {}),
        },
      ]);
      if (error) {
        toast("Couldn't post your response", "error");
        return false;
      }
      await fetchComments();
      return true;
    },
    update: async (id, content) => {
      const { error } = await supabase.from("comments").update({ content }).eq("id", id);
      if (error) {
        toast("Couldn't update response", "error");
        return false;
      }
      await fetchComments();
      return true;
    },
    remove: (id) => setDeleteId(id),
    like: async (commentId, isLiked) => {
      if (!user) return requireUser();
      const { error } = isLiked
        ? await supabase
            .from("comment_likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", user.id)
        : await supabase
            .from("comment_likes")
            .insert([{ comment_id: commentId, user_id: user.id }]);
      if (error) toast("Couldn't update like", "error");
      fetchComments();
    },
  };

  const confirmDelete = async () => {
    const { error } = await supabase.from("comments").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) toast("Couldn't delete response", "error");
    else {
      toast("Response deleted");
      fetchComments();
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesFor = (id) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <section>
      <h2 className="font-creato text-xl font-bold text-black">
        Responses {comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="mt-6">
        {user ? (
          <Composer placeholder="What are your thoughts?" submitLabel="Respond" onSubmit={actions.post} />
        ) : (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <Link href="/signin" className="font-medium text-black underline underline-offset-2">
              Sign in
            </Link>{" "}
            to share your thoughts.
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-3 w-40 rounded shimmer" />
            <div className="h-4 w-full rounded shimmer" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No responses yet. Be the first to share your thoughts.
          </p>
        ) : (
          topLevel.map((c) => (
            <ResponseItem key={c.id} comment={c} replies={repliesFor(c.id)} actions={actions} />
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete response?"
        description="This response and its likes will be removed permanently."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </section>
  );
}
