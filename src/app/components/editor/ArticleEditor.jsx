"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingBar from "react-top-loading-bar";
import { useRouter } from "next/navigation";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES } from "@/lib/constants";
import { slugify, stripHtml } from "@/lib/articleUtils";
import { cleanPastedHtml } from "./cleanPastedHtml";

/* ─────────────────────────────────────────
   SEO HELPERS
───────────────────────────────────────── */
function calcSeoScore(seo) {
  let s = 0;
  const t = seo.metaTitle.trim().length;
  const d = seo.metaDesc.trim().length;
  if (t >= 30 && t <= 60) s += 20; else if (t > 0) s += 8;
  if (d >= 120 && d <= 160) s += 20; else if (d > 0) s += 8;
  if (seo.slug.trim().length > 0) s += 15;
  if (seo.ogTitle.trim().length > 0) s += 10;
  if (seo.ogDesc.trim().length > 0) s += 10;
  if (seo.canonical.trim().length > 0) s += 10;
  if (seo.twitterCard) s += 5;
  if (seo.schemaType !== "none") s += 10;
  return Math.min(s, 100);
}
function scoreColor(s) { return s >= 75 ? "#22c55e" : s >= 45 ? "#f59e0b" : "#ef4444"; }
function scoreLabel(s) { return s >= 75 ? "Good" : s >= 45 ? "Needs work" : "Poor"; }

const EMPTY_SEO = {
  metaTitle: "", metaDesc: "", slug: "", canonical: "",
  ogTitle: "", ogDesc: "", robots: "index",
  twitterCard: true, schemaType: "article", focusKw: "", nofollow: false,
};

const MIN_TOPICS = 3;
const MAX_TOPICS = 5;

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const safeFileName = (file) => {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
};

/* ─────────────────────────────────────────
   TOOLBAR ICONS
───────────────────────────────────────── */
const svg = (children, props = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
);

const ICONS = {
  bold: svg(<><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></>),
  italic: svg(<><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></>),
  underline: svg(<><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></>),
  strike: svg(<><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></>),
  quote: svg(<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />, { fill: "currentColor", stroke: "none" }),
  code: svg(<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>),
  ul: svg(<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>),
  ol: svg(<><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></>),
  link: svg(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
  image: svg(<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>),
};

const Divider = () => <div className="mx-1.5 h-5 w-px shrink-0 bg-gray-200" />;

/* ─────────────────────────────────────────
   EDITOR
───────────────────────────────────────── */
export default function ArticleEditor({ articleId: initialId = null }) {
  const loadingBarRef = useRef(null);
  const { user, profile } = useAuthContext();
  const router = useRouter();
  const toast = useToast();

  const [articleId, setArticleId] = useState(initialId);
  const [status, setStatus] = useState("draft");
  const [existingSlug, setExistingSlug] = useState("");
  const [publishedAt, setPublishedAt] = useState(null);
  const [loadState, setLoadState] = useState(initialId ? "loading" : "ready"); // loading | ready | missing

  /* editor refs */
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const imgRef = useRef(null);
  const coverRef = useRef(null);
  const toolbarRef = useRef(null);
  const savedRange = useRef(null);
  const editorContainerRef = useRef(null);

  /* editor state */
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [wc, setWc] = useState(0);
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  /* formatting state */
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, strike: false, ul: false, ol: false, block: "p" });
  const [linkModal, setLinkModal] = useState({ open: false, url: "", x: 0, y: 0 });

  /* toolbar scroll fades */
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  /* form state */
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [selCats, setSelCats] = useState([]);
  const [catError, setCatError] = useState("");

  /* SEO state */
  const [seo, setSeo] = useState(EMPTY_SEO);
  const setSeoField = (k, v) => {
    setSeo((s) => ({ ...s, [k]: v }));
    setDirty(true);
  };

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  /* ---------- toolbar fade on horizontal scroll ---------- */
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftFade(scrollLeft > 2);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 2);
    };
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    checkScroll();
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [loadState]);

  /* ---------- load existing article ---------- */
  useEffect(() => {
    if (!initialId || !user?.id) return;

    const loadArticle = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", initialId)
        .eq("author_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setLoadState("missing");
        return;
      }

      setTitle(data.title === "Untitled draft" ? "" : data.title || "");
      setShortDesc(data.meta_description || "");
      setCoverUrl(data.cover_image || "");
      setCoverPreview(data.cover_image || "");
      setSelCats(data.categories || []);
      setStatus(data.status || "draft");
      setExistingSlug(data.slug || "");
      setPublishedAt(data.published_at || null);
      setSeo({
        metaTitle: data.seo_title || "",
        metaDesc: data.seo_description || "",
        slug: data.seo_slug || "",
        canonical: data.canonical_url || "",
        ogTitle: data.og_title || "",
        ogDesc: data.og_description || "",
        robots: data.robots || "index",
        twitterCard: data.twitter_card ?? true,
        schemaType: data.schema_type || "article",
        focusKw: data.focus_keyword || "",
        nofollow: data.nofollow_links ?? false,
      });
      setLoadState("ready");

      // The editor div renders once loadState is "ready".
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || "";
          setWc(countWords(editorRef.current.innerText || ""));
        }
        autoResize(titleRef.current);
        autoResize(subRef.current);
      });
    };

    loadArticle();
  }, [initialId, user?.id]);

  /* ---------- warn before leaving with unsaved changes ---------- */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* ---------- formatting ---------- */
  const getBlock = () => {
    try {
      let node = document.getSelection().anchorNode;
      while (node && node !== editorRef.current) {
        if (/^(H[1-6]|P|BLOCKQUOTE|PRE)$/.test(node.nodeName)) return node.nodeName.toLowerCase();
        node = node.parentNode;
      }
    } catch { }
    return "p";
  };

  const refFmt = () => {
    try {
      setFmt({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        block: getBlock(),
      });
    } catch { }
  };

  const onInput = () => {
    setWc(countWords(editorRef.current?.innerText || ""));
    setDirty(true);
    refFmt();
  };

  const run = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    setDirty(true);
    refFmt();
  };

  const toggleBlock = (tag) => {
    document.execCommand("formatBlock", false, getBlock() === tag ? "p" : tag);
    setDirty(true);
    refFmt();
  };

  const onPaste = (e) => {
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    e.preventDefault();
    if (html) document.execCommand("insertHTML", false, cleanPastedHtml(html));
    else document.execCommand("insertText", false, text);
    onInput();
  };

  const onEditorKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openLinkModal();
    }
  };

  // Ctrl/Cmd+S saves a draft from anywhere on the page.
  const saveRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- links ---------- */
  const openLinkModal = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
    savedRange.current = range.cloneRange();

    // Check for existing link
    let existingUrl = "";
    let node = range.commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeName === "A") {
        existingUrl = node.getAttribute("href") || "";
        break;
      }
      node = node.parentNode;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = editorContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    let x = rect.left - containerRect.left + rect.width / 2;
    let y = rect.bottom - containerRect.top + 10;

    if (rect.width === 0 && rect.height === 0) {
      const parent = range.commonAncestorContainer.parentElement;
      if (parent) {
        const pRect = parent.getBoundingClientRect();
        x = pRect.left - containerRect.left;
        y = pRect.bottom - containerRect.top + 10;
      }
    }

    setLinkModal({ open: true, url: existingUrl, x, y });
  };

  const submitLink = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);

      if (linkModal.url.trim()) {
        let url = linkModal.url.trim();
        if (!/^(https?:\/\/|mailto:)/i.test(url)) url = "https://" + url;
        run("createLink", url);
      } else {
        run("unlink");
      }
    }
    setLinkModal({ open: false, url: "", x: 0, y: 0 });
    savedRange.current = null;
  };

  /* ---------- topics ---------- */
  const toggleCat = (cat) => {
    setCatError("");
    setDirty(true);
    setSelCats((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= MAX_TOPICS) {
        setCatError(`You can pick up to ${MAX_TOPICS} topics.`);
        return prev;
      }
      return [...prev, cat];
    });
  };

  /* ---------- images ---------- */
  const uploadImage = async (file, folder) => {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Images must be under 5 MB.");
    const fileName = `${folder}/${safeFileName(file)}`;
    const { error } = await supabase.storage.from("article-images").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("article-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const onCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);
    setCoverUploading(true);
    try {
      const url = await uploadImage(file, "covers");
      setCoverUrl(url);
      setDirty(true);
    } catch (err) {
      setCoverPreview(coverUrl);
      toast(err.message || "Cover upload failed", "error");
    } finally {
      setCoverUploading(false);
    }
  };

  const removeCover = () => {
    setCoverUrl("");
    setCoverPreview("");
    setDirty(true);
  };

  const onImgFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file, "inline");
      editorRef.current?.focus();
      if (savedRange.current) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
      document.execCommand("insertHTML", false, `<img src="${url}" alt="" /><p><br></p>`);
      onInput();
    } catch (err) {
      toast(err.message || "Image upload failed", "error");
    }
  };

  /* ---------- persistence ---------- */
  const buildPayload = () => ({
    title: title.trim() || "Untitled draft",
    content: editorRef.current?.innerHTML || "",
    meta_description: shortDesc.trim(),
    author_id: user.id,
    cover_image: coverUrl || null,
    categories: selCats,
    seo_title: seo.metaTitle || null,
    seo_description: seo.metaDesc || null,
    canonical_url: seo.canonical || null,
    og_title: seo.ogTitle || null,
    og_description: seo.ogDesc || null,
    robots: seo.robots,
    twitter_card: seo.twitterCard,
    schema_type: seo.schemaType,
    focus_keyword: seo.focusKw || null,
    nofollow_links: seo.nofollow,
  });

  const persist = async (payload) => {
    if (articleId) {
      const { error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", articleId)
        .eq("author_id", user.id);
      if (error) throw error;
      return articleId;
    }
    const { data, error } = await supabase
      .from("articles")
      .insert([payload])
      .select("id")
      .single();
    if (error) throw error;
    setArticleId(data.id);
    // Keep editing the same row from now on (no duplicate drafts).
    window.history.replaceState(null, "", `/write/${data.id}`);
    return data.id;
  };

  const uniqueSlug = async (base) => {
    const root = base || `story-${Date.now().toString(36)}`;
    let query = supabase.from("articles").select("id").eq("slug", root).limit(1);
    if (articleId) query = query.neq("id", articleId);
    const { data } = await query;
    return data?.length ? `${root}-${Math.random().toString(36).slice(2, 7)}` : root;
  };

  const saveDraft = async () => {
    if (saving || publishing) return;
    setSaving(true);
    try {
      await persist({
        ...buildPayload(),
        // Saving an already-published story keeps it published.
        status: status === "published" ? "published" : "draft",
        seo_slug: seo.slug || slugify(title) || null,
      });
      setDirty(false);
      setLastSaved(new Date());
      toast(status === "published" ? "Changes saved" : "Draft saved");
    } catch (err) {
      toast(err.message || "Couldn't save draft", "error");
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    saveRef.current = saveDraft;
  });

  const publishArticle = async () => {
    if (!title.trim()) {
      toast("Add a title before publishing", "error");
      titleRef.current?.focus();
      return;
    }
    if (countWords(stripHtml(editorRef.current?.innerHTML || "")) < 20) {
      toast("Your story needs a little more content (20+ words)", "error");
      editorRef.current?.focus();
      return;
    }
    if (selCats.length < MIN_TOPICS) {
      setCatError(`Please select at least ${MIN_TOPICS} topics`);
      document.getElementById("topics")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setPublishing(true);
      loadingBarRef.current?.continuousStart();

      const desiredSlug = seo.slug ? slugify(seo.slug) : existingSlug || slugify(title);
      const slug = desiredSlug === existingSlug ? existingSlug : await uniqueSlug(desiredSlug);

      const payload = {
        ...buildPayload(),
        slug,
        seo_slug: slug,
        status: "published",
      };
      if (!publishedAt) payload.published_at = new Date().toISOString();
      if (!articleId) payload.view_count = 0;

      await persist(payload);
      setDirty(false);
      loadingBarRef.current?.complete();
      toast(status === "published" ? "Story updated" : "Your story is live!");
      router.push(`/read/${slug}`);
    } catch (err) {
      toast(err.message || "Publishing failed", "error");
      setPublishing(false);
      loadingBarRef.current?.complete();
    }
  };

  const score = calcSeoScore(seo);
  const serpUrl = seo.canonical || `vichento.com/read/${seo.slug || slugify(title) || "article-slug"}`;
  const serpTitle = seo.metaTitle || title || "Page Title";
  const serpDesc = seo.metaDesc || shortDesc || "Add a meta description to control how this page appears in search results.";

  const statusText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSaved
        ? "Saved"
        : "";

  const fmtBtn = (active) =>
    `w-8 h-8 flex items-center justify-center rounded shrink-0 transition-colors ${
      active ? "bg-gray-200 text-black" : "text-gray-600 hover:bg-gray-100 hover:text-black"
    }`;

  /* ---------- states ---------- */
  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-5 px-4 pt-24 sm:px-6">
        <div className="h-12 w-3/4 rounded shimmer" />
        <div className="h-6 w-1/2 rounded shimmer" />
        <div className="h-4 w-full rounded shimmer" />
        <div className="h-4 w-5/6 rounded shimmer" />
      </div>
    );
  }

  if (loadState === "missing") {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-creato text-2xl font-bold text-black">Story not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          It may have been deleted, or it belongs to another writer.
        </p>
        <Link href="/stories" className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm text-white">
          Your stories
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-white pb-24 text-gray-900">
      <LoadingBar color="#1a1a1a" ref={loadingBarRef} />

      <div className="sticky top-[64px] z-40 flex w-full flex-col border-b border-gray-200 bg-white/95 backdrop-blur-md">
        {/* Action Topbar */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm text-gray-500">
            <span className="hidden truncate sm:inline">
              {status === "published" ? "Editing" : "Draft"} in{" "}
              <span className="text-black">{profile?.name || "your stories"}</span>
            </span>
            {statusText && (
              <>
                <span className="hidden text-gray-300 sm:inline">·</span>
                <span className={dirty ? "text-amber-600" : ""}>{statusText}</span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setSeoOpen(!seoOpen)}
            >
              <span className={`h-2 w-2 rounded-full ${seo.metaTitle || seo.metaDesc ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="hidden sm:inline">SEO Settings</span>
              <span className="sm:hidden">SEO</span>
            </button>
            <button
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-50"
              onClick={saveDraft}
              disabled={saving || publishing}
              title="Save (Ctrl+S)"
            >
              {status === "published" ? "Save" : <>Save<span className="hidden sm:inline"> draft</span></>}
            </button>
            <button
              className="rounded-full bg-black px-5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
              onClick={publishArticle}
              disabled={publishing || saving}
            >
              {publishing ? "Publishing…" : status === "published" ? "Update" : "Publish"}
            </button>
          </div>
        </div>

        {/* Format Toolbar */}
        <div className="relative w-full overflow-hidden">
          <div className={`pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-r from-white to-transparent transition-opacity duration-300 ${showLeftFade ? "opacity-100" : "opacity-0"}`} />
          <div className={`pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-l from-white to-transparent transition-opacity duration-300 ${showRightFade ? "opacity-100" : "opacity-0"}`} />

          <div
            ref={toolbarRef}
            role="toolbar"
            aria-label="Formatting"
            className="hide-scrollbar flex w-full items-center justify-start gap-1.5 overflow-x-auto scroll-smooth px-4 py-2 sm:justify-center sm:px-10"
          >
            {[
              ["bold", "Bold (Ctrl+B)", fmt.bold, () => run("bold")],
              ["italic", "Italic (Ctrl+I)", fmt.italic, () => run("italic")],
              ["underline", "Underline (Ctrl+U)", fmt.underline, () => run("underline")],
              ["strike", "Strikethrough", fmt.strike, () => run("strikeThrough")],
            ].map(([key, label, active, action]) => (
              <button key={key} className={fmtBtn(active)} onMouseDown={(e) => { e.preventDefault(); action(); }} title={label} aria-label={label} aria-pressed={active}>
                {ICONS[key]}
              </button>
            ))}

            <Divider />

            {[["p", "Paragraph"], ["h1", "Heading 1"], ["h2", "Heading 2"], ["h3", "Heading 3"]].map(([tag, label]) => (
              <button
                key={tag}
                className={`${fmtBtn(fmt.block === tag)} font-creato text-sm font-bold`}
                onMouseDown={(e) => { e.preventDefault(); toggleBlock(tag); }}
                title={label}
                aria-label={label}
                aria-pressed={fmt.block === tag}
              >
                {tag.toUpperCase()}
              </button>
            ))}

            <Divider />

            <button className={fmtBtn(fmt.block === "blockquote")} onMouseDown={(e) => { e.preventDefault(); toggleBlock("blockquote"); }} title="Quote" aria-label="Quote">
              {ICONS.quote}
            </button>
            <button className={fmtBtn(fmt.block === "pre")} onMouseDown={(e) => { e.preventDefault(); toggleBlock("pre"); }} title="Code block" aria-label="Code block">
              {ICONS.code}
            </button>

            <Divider />

            <button className={fmtBtn(fmt.ul)} onMouseDown={(e) => { e.preventDefault(); run("insertUnorderedList"); }} title="Bullet list" aria-label="Bullet list">
              {ICONS.ul}
            </button>
            <button className={fmtBtn(fmt.ol)} onMouseDown={(e) => { e.preventDefault(); run("insertOrderedList"); }} title="Numbered list" aria-label="Numbered list">
              {ICONS.ol}
            </button>

            <Divider />

            <button className={fmtBtn(false)} onMouseDown={(e) => { e.preventDefault(); openLinkModal(); }} title="Link (Ctrl+K)" aria-label="Link">
              {ICONS.link}
            </button>
            <button
              className={fmtBtn(false)}
              onMouseDown={(e) => {
                e.preventDefault();
                const sel = window.getSelection();
                savedRange.current =
                  sel?.rangeCount && editorRef.current?.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
                imgRef.current?.click();
              }}
              title="Image"
              aria-label="Insert image"
            >
              {ICONS.image}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-16">
        {/* Cover Image */}
        <div className="group relative mb-8">
          {!coverPreview ? (
            <button
              className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
              onClick={() => coverRef.current?.click()}
            >
              <PhotoIcon className="size-5" />
              Add a cover image
            </button>
          ) : (
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={coverPreview}
                alt="Cover"
                width={768}
                height={400}
                unoptimized
                className={`max-h-[400px] w-full object-cover transition-opacity ${coverUploading ? "opacity-50" : ""}`}
              />
              {coverUploading && (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-black">
                  Uploading…
                </span>
              )}
              <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity group-hover:opacity-100 sm:opacity-0">
                <button
                  className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-black shadow-sm backdrop-blur-sm hover:bg-white"
                  onClick={() => coverRef.current?.click()}
                >
                  Change
                </button>
                <button
                  className="rounded-full bg-white/90 p-1.5 text-black shadow-sm backdrop-blur-sm hover:bg-white"
                  onClick={removeCover}
                  aria-label="Remove cover image"
                >
                  <XMarkIcon className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <textarea
          ref={titleRef}
          className="mb-4 w-full resize-none overflow-hidden border-none bg-transparent font-creato text-3xl font-bold leading-tight text-gray-900 outline-none placeholder-gray-300 sm:text-4xl md:text-5xl"
          placeholder="Title"
          rows={1}
          value={title}
          maxLength={150}
          onChange={(e) => {
            setTitle(e.target.value.replace(/\n/g, ""));
            setDirty(true);
            autoResize(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              subRef.current?.focus();
            }
          }}
        />

        <textarea
          ref={subRef}
          className="mb-8 w-full resize-none overflow-hidden border-none bg-transparent text-xl leading-snug text-gray-500 outline-none placeholder-gray-300"
          placeholder="Write a brief subtitle…"
          rows={1}
          value={shortDesc}
          maxLength={200}
          onChange={(e) => {
            setShortDesc(e.target.value.replace(/\n/g, ""));
            setDirty(true);
            autoResize(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              editorRef.current?.focus();
            }
          }}
        />

        <div className="relative" ref={editorContainerRef}>
          <div
            ref={editorRef}
            data-placeholder="Tell your story…"
            className="min-h-[50vh] pb-16 font-serif text-gray-800 focus:outline-none
              [&_p]:mb-4 [&_p]:text-lg [&_p]:leading-relaxed
              [&_ul]:mb-5 [&_ul]:ml-6 [&_ul]:list-disc [&_ul_li]:mb-1.5 [&_ul_li]:pl-1
              [&_ol]:mb-5 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol_li]:mb-1.5 [&_ol_li]:pl-1
              [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:font-sans [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-gray-900
              [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:font-sans [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-gray-900
              [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:font-sans [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-gray-900
              [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-gray-600
              [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-gray-200 [&_pre]:bg-gray-50 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm
              [&_img]:my-6 [&_img]:block [&_img]:max-w-full [&_img]:rounded-lg
              [&_a]:text-blue-600 [&_a]:underline"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Story body"
            onInput={onInput}
            onPaste={onPaste}
            onKeyDown={onEditorKeyDown}
            onMouseUp={refFmt}
            onKeyUp={refFmt}
          />

          {/* Floating Link Popover (relative to editor container) */}
          {linkModal.open && (
            <div
              className="animate-dropdown absolute z-[100] flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl"
              style={{
                left: Math.max(0, Math.min(linkModal.x - 150, (editorContainerRef.current?.clientWidth || 600) - 320)),
                top: linkModal.y,
              }}
            >
              <div className="flex items-center rounded-lg bg-gray-50 px-2.5 py-1.5 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-black/5">
                <span className="mr-2 text-gray-400">{ICONS.link}</span>
                <input
                  autoFocus
                  className="w-44 border-none bg-transparent text-[13px] outline-none sm:w-64"
                  placeholder="Paste a link…"
                  value={linkModal.url}
                  onChange={(e) => setLinkModal({ ...linkModal, url: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitLink();
                    if (e.key === "Escape") setLinkModal({ ...linkModal, open: false });
                  }}
                />
              </div>
              <button
                className="h-8 rounded-lg bg-black px-3.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-gray-800"
                onClick={submitLink}
              >
                {linkModal.url ? "Apply" : "Unlink"}
              </button>
              <button
                className="p-1.5 text-gray-400 transition-colors hover:text-gray-600"
                onClick={() => setLinkModal({ ...linkModal, open: false })}
                aria-label="Close"
              >
                <XMarkIcon className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Categories */}
        <div id="topics" className="mt-16 border-t border-gray-100 pb-16 pt-8">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Topics</h3>
              <p className="text-xs text-gray-500">
                Select {MIN_TOPICS}–{MAX_TOPICS} topics so readers can discover your story
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {selCats.length}/{MAX_TOPICS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                aria-pressed={selCats.includes(cat)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  selCats.includes(cat)
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-black"
                }`}
                onClick={() => toggleCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          {catError && <p className="mt-3 text-xs font-medium text-red-500">{catError}</p>}
        </div>
      </div>

      {/* Word Count Floating */}
      <div className={`pointer-events-none fixed bottom-6 right-4 z-30 rounded-full bg-white/90 px-3 py-1 font-mono text-xs font-medium text-gray-500 shadow-sm transition-opacity sm:right-8 ${seoOpen ? "opacity-0" : "opacity-100"}`}>
        {wc} {wc === 1 ? "word" : "words"} · {Math.max(1, Math.round(wc / 225))} min read
      </div>

      {/* SEO Drawer backdrop */}
      <div
        onClick={() => setSeoOpen(false)}
        className={`fixed inset-0 z-[55] bg-black/10 transition-opacity ${seoOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* SEO Drawer */}
      <aside
        aria-hidden={!seoOpen}
        className={`fixed right-0 top-0 z-[60] flex h-full w-full transform flex-col border-l border-gray-100 bg-white transition-transform duration-300 ease-in-out sm:w-[380px] ${seoOpen ? "translate-x-0 shadow-[-8px_0_40px_rgba(0,0,0,0.06)]" : "translate-x-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">SEO Settings</h2>
            <p className="mt-0.5 text-[11px] text-gray-500">Optimize for search engines</p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setSeoOpen(false)}
            aria-label="Close SEO settings"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>

        <div className="hide-scrollbar flex-1 overflow-y-auto pb-8">
          {/* SERP Preview */}
          <div className="p-5 pb-2">
            <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Search Preview <div className="h-px flex-1 bg-gray-100"></div>
            </h3>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">Google Preview</div>
              <div className="mb-1 truncate text-xs text-green-700">{serpUrl}</div>
              <div className="mb-1 truncate text-base leading-snug text-blue-700">{serpTitle}</div>
              <div className="line-clamp-2 text-[13px] leading-relaxed text-gray-600">{serpDesc}</div>
            </div>
          </div>

          {/* Basic SEO */}
          <div className="p-5 pt-2">
            <h3 className="mb-4 mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Basic SEO <div className="h-px flex-1 bg-gray-100"></div>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">Focus Keyword</label>
                <input className="w-full rounded-md border border-gray-200 bg-gray-50 p-2.5 text-[13px] outline-none transition-colors focus:border-black focus:bg-white" placeholder="e.g. react editor tutorial" value={seo.focusKw} onChange={(e) => setSeoField("focusKw", e.target.value)} />
                <p className="mt-1.5 text-[11px] text-gray-400">The main keyword you want this page to rank for.</p>
              </div>
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
                  Meta Title
                  <span className={`font-mono text-[11px] ${seo.metaTitle.length > 60 ? "text-red-500" : seo.metaTitle.length > 50 ? "text-yellow-500" : "text-gray-400"}`}>{seo.metaTitle.length}/60</span>
                </label>
                <input className="w-full rounded-md border border-gray-200 bg-gray-50 p-2.5 text-[13px] outline-none transition-colors focus:border-black focus:bg-white" placeholder="Page title for search engines…" value={seo.metaTitle} onChange={(e) => setSeoField("metaTitle", e.target.value)} />
                <p className="mt-1.5 text-[11px] text-gray-400">Ideal: 30–60 characters.</p>
              </div>
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
                  Meta Description
                  <span className={`font-mono text-[11px] ${seo.metaDesc.length > 160 ? "text-red-500" : seo.metaDesc.length > 140 ? "text-yellow-500" : "text-gray-400"}`}>{seo.metaDesc.length}/160</span>
                </label>
                <textarea className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 p-2.5 text-[13px] outline-none transition-colors focus:border-black focus:bg-white" rows={3} placeholder="Brief summary for search results…" value={seo.metaDesc} onChange={(e) => setSeoField("metaDesc", e.target.value)} />
                <p className="mt-1.5 text-[11px] text-gray-400">Ideal: 120–160 characters.</p>
              </div>
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">URL Slug</label>
                <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 transition-colors focus-within:border-black focus-within:bg-white">
                  <span className="whitespace-nowrap py-2.5 pl-3 font-mono text-xs text-gray-400">/read/</span>
                  <input className="min-w-0 flex-1 border-none bg-transparent p-2.5 pl-1 font-mono text-[13px] outline-none" placeholder={slugify(title) || "article-url-slug"} value={seo.slug} onChange={(e) => setSeoField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
                </div>
              </div>
            </div>
          </div>

          {/* Open Graph & Advanced */}
          <div className="p-5 pt-0">
            <h3 className="mb-4 mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Advanced <div className="h-px flex-1 bg-gray-100"></div>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">Canonical URL</label>
                <input className="w-full rounded-md border border-gray-200 bg-gray-50 p-2.5 text-[13px] outline-none transition-colors focus:border-black focus:bg-white" placeholder="https://yoursite.com/article-slug" value={seo.canonical} onChange={(e) => setSeoField("canonical", e.target.value)} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-700">Twitter Card</div>
                  <div className="text-[11px] text-gray-400">Large image preview on X</div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" checked={seo.twitterCard} onChange={(e) => setSeoField("twitterCard", e.target.checked)} />
                  <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 bg-white p-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}></div>
          </div>
          <div className="whitespace-nowrap text-xs font-bold" style={{ color: scoreColor(score) }}>
            {score}% · {scoreLabel(score)}
          </div>
        </div>
      </aside>

      {/* Inputs */}
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCoverFile} />
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={onImgFile} />
    </div>
  );
}
