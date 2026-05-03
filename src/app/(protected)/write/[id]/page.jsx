"use client";

import { useState, useRef, useEffect } from "react";
import LoadingBar from "react-top-loading-bar";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { XCircleIcon } from "@heroicons/react/24/outline";

/* ─────────────────────────────────────────
   SEO HELPERS
───────────────────────────────────────── */
function calcSeoScore(seo) {
  let s = 0;
  if (seo.metaTitle.trim().length >= 30 && seo.metaTitle.trim().length <= 60) s += 20; else if (seo.metaTitle.trim().length > 0) s += 8;
  if (seo.metaDesc.trim().length >= 120 && seo.metaDesc.trim().length <= 160) s += 20; else if (seo.metaDesc.trim().length > 0) s += 8;
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

const CATEGORIES = [
  "Technology", "AI", "Startups", "Business", "Programming",
  "Design", "Productivity", "Finance", "Marketing",
  "Health", "Career", "Sports", "Science", "Writing",
];

export default function EditCreatePage() {
  const { id } = useParams();
  const loadingBarRef = useRef(null);
  const { user } = useAuthContext();
  const router = useRouter();

  /* editor refs */
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const imgRef = useRef(null);
  const coverRef = useRef(null);

  /* editor state */
  const [cover, setCover] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [wc, setWc] = useState(0);
  const [seoOpen, setSeoOpen] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "ok", show: false });
  const [publishing, setPublishing] = useState(false);

  /* formatting state */
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, strike: false, ul: false, ol: false, block: "p" });
  const [hMenuOpen, setHMenuOpen] = useState(false);

  /* form state */
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [selCats, setSelCats] = useState([]);
  const [catError, setCatError] = useState("");

  /* SEO state */
  const [seo, setSeo] = useState({
    metaTitle: "", metaDesc: "", slug: "", canonical: "",
    ogTitle: "", ogDesc: "", robots: "index",
    twitterCard: true, schemaType: "article", focusKw: "", nofollow: false,
  });
  const setSeoField = (k, v) => setSeo(s => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!id) return;
    const loadArticle = async () => {
      try {
        const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
        if (error) throw error;
        
        setTitle(data.title || "");
        setShortDesc(data.meta_description || "");
        setCoverUrl(data.cover_image || "");
        if (data.cover_image) setCover(data.cover_image); // To show preview
        setSelCats(data.categories || []);
        
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || "";
        }
        
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
      } catch (err) {
        showToast("Failed to load article", "error");
      }
    };
    loadArticle();
  }, [id]);

  const showToast = (m, t = "ok") => {
    setToast({ msg: m, type: t, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const ar = el => { if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; };

  const onInput = () => {
    const text = editorRef.current?.innerText || "";
    setWc(text.trim().split(/\s+/).filter(Boolean).length);
    setTitle(titleRef.current?.value || "");
    refFmt();
  };

  const getBlock = () => {
    try {
      let node = document.getSelection().anchorNode;
      while (node && node.nodeName !== "DIV") {
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

  const run = (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); refFmt(); };
  const toggleBlock = tag => { document.execCommand("formatBlock", false, getBlock() === tag ? "p" : tag); refFmt(); setHMenuOpen(false); };

  const toggleCat = cat => {
    setCatError("");
    setSelCats(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      if (prev.length >= 5) return prev;
      return [...prev, cat];
    });
  };

  const generateSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const onCoverFile = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCover(ev.target.result);
    reader.readAsDataURL(file);

    try {
      const fileName = `covers/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("article-images").upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("article-images").getPublicUrl(fileName);
      setCoverUrl(data.publicUrl);
    } catch (err) {
      showToast("Cover upload failed", "error");
    }
    e.target.value = "";
  };

  const onImgFile = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const fileName = `inline/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("article-images").upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("article-images").getPublicUrl(fileName);
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, `<img src="${data.publicUrl}" alt="" class="max-w-full rounded-lg my-6 block" /><p><br></p>`);
    } catch (err) {
      showToast("Image upload failed", "error");
    }
    e.target.value = "";
  };

  const saveDraft = async () => {
    try {
      const payload = {
        title: title || "Untitled draft",
        content: editorRef.current?.innerHTML || "",
        meta_description: shortDesc,
        author_id: user.id,
        cover_image: coverUrl,
        categories: selCats,
        status: "draft",
        // SEO mappings
        seo_title: seo.metaTitle || null,
        seo_description: seo.metaDesc || null,
        seo_slug: seo.slug || generateSlug(title || "Untitled draft"),
        canonical_url: seo.canonical || null,
        og_title: seo.ogTitle || null,
        og_description: seo.ogDesc || null,
        robots: seo.robots,
        twitter_card: seo.twitterCard,
        schema_type: seo.schemaType,
        focus_keyword: seo.focusKw || null,
        nofollow_links: seo.nofollow,
      };

      let error;
      if (id) {
        const { error: updateError } = await supabase.from("articles").update(payload).eq("id", id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from("articles").insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      showToast("Draft updated");
      router.push("/stories");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const publishArticle = async () => {
    if (selCats.length < 3) { setCatError("Please select at least 3 categories"); return; }
    try {
      setPublishing(true);
      loadingBarRef.current?.continuousStart();
      const slug = seo.slug || generateSlug(title);

      const payload = {
        title: title || "Untitled article",
        content: editorRef.current?.innerHTML || "",
        meta_description: shortDesc,
        slug,
        author_id: user.id,
        cover_image: coverUrl,
        categories: selCats,
        status: "published",
        // SEO mappings
        seo_title: seo.metaTitle || null,
        seo_description: seo.metaDesc || null,
        seo_slug: slug,
        canonical_url: seo.canonical || null,
        og_title: seo.ogTitle || null,
        og_description: seo.ogDesc || null,
        robots: seo.robots,
        twitter_card: seo.twitterCard,
        schema_type: seo.schemaType,
        focus_keyword: seo.focusKw || null,
        nofollow_links: seo.nofollow,
      };

      let error;
      if (id) {
        const { error: updateError } = await supabase.from("articles").update(payload).eq("id", id);
        error = updateError;
      } else {
        payload.published_at = new Date().toISOString();
        payload.view_count = 0;
        const { error: insertError } = await supabase.from("articles").insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      loadingBarRef.current?.complete();
      setPublishing(false);
      showToast(id ? "Updated!" : "Published!");
      router.push(`/read/${slug}`);
    } catch (err) {
      showToast(err.message, "error");
      setPublishing(false);
      loadingBarRef.current?.complete();
    }
  };

  const score = calcSeoScore(seo);
  const serpUrl = seo.canonical || `yoursite.com/${seo.slug || "article-slug"}`;
  const serpTitle = seo.metaTitle || title || "Page Title";
  const serpDesc = seo.metaDesc || "Add a meta description to control how this page appears in search results.";

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-white font-sans text-gray-900 pb-24">
      <LoadingBar color="#1a1a1a" ref={loadingBarRef} />

      <div className="sticky top-[64px] z-40 bg-white/95 backdrop-blur-md flex flex-col w-full border-b border-gray-200">
        {/* Action Topbar */}
        <div className="flex items-center justify-end gap-3 px-8 py-2.5 border-b border-gray-100">
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-50" onClick={() => setSeoOpen(!seoOpen)}>
            <div className={`w-2 h-2 rounded-full ${seo.metaTitle || seo.metaDesc ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            SEO Settings
          </button>
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 bg-white shadow-sm" onClick={saveDraft}>
            Save draft
          </button>
          <button className="text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors px-5 py-1.5 rounded-full shadow-sm disabled:opacity-50" onClick={publishArticle} disabled={publishing}>
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>

        {/* Format Toolbar */}
        <div className="flex items-center justify-center gap-1.5 px-4 py-2 w-full overflow-x-auto hide-scrollbar relative">
          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.bold ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); run("bold"); }} title="Bold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
          </button>
          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.italic ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); run("italic"); }} title="Italic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
          </button>
          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.underline ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); run("underline"); }} title="Underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
          </button>
          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.strike ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); run("strikeThrough"); }} title="Strikethrough">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"></path><path d="M14 12a4 4 0 0 1 0 8H6"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1.5" />

          {/* Block Level Buttons */}
          <button className={`w-8 h-8 flex items-center justify-center rounded font-bold font-serif text-sm transition-colors ${fmt.block === 'p' ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); toggleBlock("p"); }} title="Paragraph">P</button>
          <button className={`w-8 h-8 flex items-center justify-center rounded font-bold font-serif text-sm transition-colors ${fmt.block === 'h1' ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); toggleBlock("h1"); }} title="Heading 1">H1</button>
          <button className={`w-8 h-8 flex items-center justify-center rounded font-bold font-serif text-sm transition-colors ${fmt.block === 'h2' ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); toggleBlock("h2"); }} title="Heading 2">H2</button>
          <button className={`w-8 h-8 flex items-center justify-center rounded font-bold font-serif text-sm transition-colors ${fmt.block === 'h3' ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); toggleBlock("h3"); }} title="Heading 3">H3</button>

          <div className="w-px h-5 bg-gray-200 mx-1.5" />

          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.block === 'blockquote' ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); toggleBlock("blockquote"); }} title="Quote">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
          </button>
          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.block === 'pre' ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); toggleBlock("pre"); }} title="Code Block">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1.5" />

          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.ul ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); run("insertUnorderedList"); }} title="Bullet List">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
          <button className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${fmt.ol ? 'bg-gray-200 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`} onMouseDown={e => { e.preventDefault(); run("insertOrderedList"); }} title="Numbered List">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1.5" />

          <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 hover:text-black transition-colors" onMouseDown={e => { e.preventDefault(); const u = prompt("URL:"); if (u) run("createLink", u); }} title="Link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 hover:text-black transition-colors" onMouseDown={e => { e.preventDefault(); imgRef.current?.click(); }} title="Image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-3xl mx-auto pt-16 px-6">

        {/* Cover Image */}
        <div className="mb-8 group relative">
          {!cover && (
            <button className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-2" onClick={() => coverRef.current?.click()}>
              + Add cover image
            </button>
          )}
          {cover && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={cover} alt="Cover" className="w-full max-h-[400px] object-cover" />
              <button className="absolute top-4 right-4  text-sm px-3 py-1 cursor-pointer  opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setCover(null)}>
                <XCircleIcon className="size-5" />
              </button>
            </div>
          )}
        </div>

        <textarea
          ref={titleRef}
          className="w-full text-4xl md:text-5xl font-bold text-gray-900 border-none outline-none resize-none bg-transparent placeholder-gray-300 leading-tight mb-4 overflow-hidden"
          placeholder="Title"
          rows={1}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onInput={e => ar(e.target)}
        />

        <textarea
          ref={subRef}
          className="w-full text-xl text-gray-500 border-none outline-none resize-none bg-transparent placeholder-gray-300 leading-snug mb-8"
          placeholder="Write a brief subtitle..."
          rows={1}
          value={shortDesc}
          onChange={e => setShortDesc(e.target.value)}
          onInput={e => ar(e.target)}
        />

        <div
          ref={editorRef}
          className="focus:outline-none min-h-[50vh] pb-16 text-gray-800
            [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-lg
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-5 [&_ul_li]:pl-1 [&_ul_li]:mb-1.5
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-5 [&_ol_li]:pl-1 [&_ol_li]:mb-1.5
            [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-gray-900
            [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-gray-900
            [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-gray-900
            [&_h4]:text-xl  [&_h4]:font-bold [&_h4]:mb-3 [&_h4]:mt-6 [&_h4]:text-gray-900
            [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-5
            [&_pre]:bg-gray-50 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:text-sm [&_pre]:font-mono [&_pre]:my-5 [&_pre]:border [&_pre]:border-gray-200
            [&_a]:text-blue-600 [&_a:hover]:underline
            empty:before:content-['Tell_your_story...'] empty:before:text-gray-300"
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onMouseUp={refFmt}
          onKeyUp={refFmt}
        />

        {/* Categories */}
        <div className="mt-16 pt-8 border-t border-gray-100 pb-16">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Topics</h3>
          <p className="text-xs text-gray-400 mb-4">Select 3–5 topics that best describe your article</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${selCats.includes(cat) ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:text-black'}`}
                onClick={() => toggleCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          {catError && <p className="text-xs text-red-500 mt-3 font-medium">{catError}</p>}
        </div>

      </div>

      {/* Word Count Floating */}
      <div className={`fixed bottom-6 left-8 text-xs text-gray-400 font-mono font-medium z-50 pointer-events-none transition-opacity ${seoOpen ? 'opacity-0' : 'opacity-100'}`}>
        {wc} {wc === 1 ? "word" : "words"}
      </div>

      {/* SEO Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[380px] bg-white border-l border-gray-100 shadow-[-8px_0_40px_rgba(0,0,0,0.06)] z-50 transform transition-transform duration-300 ease-in-out ${seoOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">SEO Settings</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Optimize for search engines</p>
          </div>
          <button className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={() => setSeoOpen(false)}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
          {/* SERP Preview */}
          <div className="p-5 pb-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              Search Preview <div className="flex-1 h-px bg-gray-100"></div>
            </h3>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">Google Preview</div>
              <div className="text-xs text-green-700 mb-1 truncate">{serpUrl}</div>
              <div className="text-base text-blue-700 truncate leading-snug mb-1">{serpTitle}</div>
              <div className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">{serpDesc}</div>
            </div>
          </div>

          {/* Basic SEO */}
          <div className="p-5 pt-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-4">
              Basic SEO <div className="flex-1 h-px bg-gray-100"></div>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                  Focus Keyword
                </label>
                <input className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] focus:border-black focus:ring-0 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="e.g. react editor tutorial" value={seo.focusKw} onChange={e => setSeoField("focusKw", e.target.value)} />
                <p className="text-[11px] text-gray-400 mt-1.5">The main keyword you want this page to rank for.</p>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                  Meta Title
                  <span className={`text-[11px] font-mono ${seo.metaTitle.length > 60 ? 'text-red-500' : seo.metaTitle.length > 50 ? 'text-yellow-500' : 'text-gray-400'}`}>{seo.metaTitle.length}/60</span>
                </label>
                <input className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] focus:border-black focus:ring-0 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="Page title for search engines..." value={seo.metaTitle} onChange={e => setSeoField("metaTitle", e.target.value)} />
                <p className="text-[11px] text-gray-400 mt-1.5">Ideal: 30–60 characters.</p>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                  Meta Description
                  <span className={`text-[11px] font-mono ${seo.metaDesc.length > 160 ? 'text-red-500' : seo.metaDesc.length > 140 ? 'text-yellow-500' : 'text-gray-400'}`}>{seo.metaDesc.length}/160</span>
                </label>
                <textarea className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] focus:border-black focus:ring-0 outline-none bg-gray-50 focus:bg-white transition-colors resize-none" rows={3} placeholder="Brief summary for search results..." value={seo.metaDesc} onChange={e => setSeoField("metaDesc", e.target.value)} />
                <p className="text-[11px] text-gray-400 mt-1.5">Ideal: 120–160 characters.</p>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                  URL Slug
                </label>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-gray-50 focus-within:bg-white focus-within:border-black transition-colors">
                  <span className="text-xs text-gray-400 pl-3 py-2.5 font-mono whitespace-nowrap">yoursite.com/</span>
                  <input className="flex-1 border-none bg-transparent p-2.5 pl-1 text-[13px] font-mono outline-none focus:ring-0 min-w-0" placeholder="article-url-slug" value={seo.slug} onChange={e => setSeoField("slug", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Open Graph & Advanced */}
          <div className="p-5 pt-0">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-4">
              Advanced <div className="flex-1 h-px bg-gray-100"></div>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                  Canonical URL
                </label>
                <input className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] focus:border-black focus:ring-0 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="https://yoursite.com/article-slug" value={seo.canonical} onChange={e => setSeoField("canonical", e.target.value)} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-700">Twitter Card</div>
                  <div className="text-[11px] text-gray-400">Large image preview on X</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={seo.twitterCard} onChange={e => setSeoField("twitterCard", e.target.checked)} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="shrink-0 border-t border-gray-100 p-4 bg-white flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}></div>
          </div>
          <div className="text-xs font-bold whitespace-nowrap" style={{ color: scoreColor(score) }}>
            {score}% · {scoreLabel(score)}
          </div>
        </div>
      </div>

      {/* Inputs */}
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCoverFile} />
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={onImgFile} />

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-black'} shadow-lg z-50`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
