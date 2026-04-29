"use client";

import { useState, useRef, useEffect } from "react";
import LoadingBar from "react-top-loading-bar";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { GoChevronRight } from "react-icons/go";
import { MdArrowOutward } from "react-icons/md";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

const css = `
  ${FONTS}
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  .es { min-height:100vh; background:#faf9f7; font-family:'DM Sans',sans-serif; color:#1a1a1a; }

  /* TOPBAR */
  .topbar {
    position:sticky; top:0; z-index:120; height:52px;
    background:rgba(250,249,247,.97); backdrop-filter:blur(12px);
    border-bottom:1px solid #eceae5;
    display:flex; align-items:center; justify-content:space-between; padding:0 28px;
  }
  .topbar-left { display:flex; align-items:center; gap:6px; text-decoration:none; color:#666; font-size:13px; font-family:'DM Sans',sans-serif; }
  .topbar-left:hover { color:#1a1a1a; }
  .topbar-dot { width:8px; height:8px; border-radius:50%; background:#eab308; }
  .topbar-right { display:flex; gap:8px; align-items:center; }
  .btn-pub {
    background:#1a1a1a; color:#faf9f7; border:none; border-radius:20px;
    padding:6px 16px; font-size:13px; font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; transition:opacity .15s; display:flex; align-items:center; gap:5px;
  }
  .btn-pub:hover { opacity:.75; }
  .btn-pub:disabled { opacity:.5; cursor:not-allowed; }
  .btn-ghost {
    background:none; border:1px solid #dedad4; border-radius:20px;
    padding:6px 14px; font-size:13px; font-family:'DM Sans',sans-serif;
    cursor:pointer; color:#666; transition:border-color .15s, color .15s;
  }
  .btn-ghost:hover { border-color:#aaa; color:#1a1a1a; }
  .btn-seo {
    background:none; border:1px solid #dedad4; border-radius:20px;
    padding:6px 13px; font-size:12px; font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; color:#888; transition:all .15s; display:flex; align-items:center; gap:5px;
  }
  .btn-seo:hover { border-color:#1a1a1a; color:#1a1a1a; }
  .btn-seo.active { background:#1a1a1a; color:#fff; border-color:#1a1a1a; }
  .seo-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; flex-shrink:0; transition:background .2s; }
  .seo-dot.empty { background:#e0dbd4; }

  /* FORMAT BAR */
  .fbar {
    position:sticky; top:52px; z-index:110;
    background:rgba(250,249,247,.97); backdrop-filter:blur(12px);
    border-bottom:1px solid #eceae5;
    display:flex; align-items:center; justify-content:center;
    padding:0 24px; height:44px; gap:2px;
  }
  .fb {
    background:none; border:none; color:#888; border-radius:6px; cursor:pointer;
    font-size:12px; font-weight:700; font-family:'DM Sans',sans-serif;
    transition:background .1s,color .1s;
    display:flex; align-items:center; justify-content:center;
    height:30px; min-width:30px; padding:0 7px; flex-shrink:0;
  }
  .fb:hover  { background:#ede9e3; color:#1a1a1a; }
  .fb.on     { background:#1a1a1a; color:#fff; }
  .fb.on:hover { background:#333; }
  .fb-sep { width:1px; height:18px; background:#e0dbd4; margin:0 4px; flex-shrink:0; }
  .fb.hbtn::after { content:'▾'; font-size:8px; margin-left:2px; opacity:.5; }

  /* HEADING SUBMENU */
  .hsub {
    position:fixed; z-index:250; background:#1a1a1a; border-radius:8px;
    padding:4px; display:flex; gap:2px;
    box-shadow:0 4px 20px rgba(0,0,0,.35); transition:opacity .12s,transform .12s;
  }
  .hsub.off { opacity:0; pointer-events:none; transform:translateY(4px); }
  .hsub.on  { opacity:1; pointer-events:all; transform:translateY(0); }
  .hsb {
    background:none; border:none; color:#888; border-radius:5px; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-weight:700; font-size:11px;
    width:34px; height:28px; display:flex; align-items:center; justify-content:center;
    transition:background .1s,color .1s;
  }
  .hsb:hover { background:#2a2a2a; color:#fff; }
  .hsb.on    { background:#fff; color:#1a1a1a; }

  /* SEO DRAWER */
  .seo-drawer {
    position:absolute; top:0; right:0; bottom:0; z-index:115; width:380px;
    background:#fff; border-left:1px solid #eceae5;
    box-shadow:-8px 0 40px rgba(0,0,0,.06);
    display:flex; flex-direction:column;
    transform:translateX(100%);
    transition:transform .35s cubic-bezier(.4,0,.2,1);
    overflow:hidden;
  }
  .seo-drawer.open { transform:translateX(0); }
  .seo-head {
    position:sticky; top:0;
    padding:16px 20px 14px; border-bottom:1px solid #f0ede8;
    display:flex; align-items:center; justify-content:space-between;
    flex-shrink:0; background:#fff; z-index:1;
  }
  .seo-head-title { font-size:14px; font-weight:600; color:#1a1a1a; }
  .seo-head-sub   { font-size:11px; color:#aaa; margin-top:1px; }
  .seo-close {
    width:28px; height:28px; border-radius:6px; border:none; background:none;
    cursor:pointer; color:#aaa; display:flex; align-items:center; justify-content:center;
    font-size:16px; transition:background .1s,color .1s;
  }
  .seo-close:hover { background:#f5f2ee; color:#1a1a1a; }
  .seo-body { flex:1; overflow-y:auto; padding:4px 0 24px; scrollbar-width:thin; scrollbar-color:#e0dbd4 transparent; }
  .seo-body::-webkit-scrollbar { width:4px; }
  .seo-body::-webkit-scrollbar-thumb { background:#e0dbd4; border-radius:4px; }
  .seo-section { padding:16px 20px 0; }
  .seo-section-label {
    font-size:10px; font-weight:600; color:#bbb; letter-spacing:.1em;
    text-transform:uppercase; margin-bottom:12px;
    display:flex; align-items:center; gap:6px;
  }
  .seo-section-label::after { content:''; flex:1; height:1px; background:#f0ede8; }
  .seo-field { margin-bottom:14px; }
  .seo-label { display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:500; color:#555; margin-bottom:5px; }
  .seo-label-count { font-size:11px; font-weight:400; color:#bbb; font-family:'JetBrains Mono',monospace; }
  .seo-label-count.warn { color:#f59e0b; }
  .seo-label-count.over { color:#ef4444; }
  .seo-inp {
    width:100%; border:1.5px solid #eceae5; border-radius:7px;
    padding:8px 11px; font-size:13px; font-family:'DM Sans',sans-serif;
    color:#1a1a1a; background:#faf9f7; outline:none; resize:none; transition:border-color .15s,background .15s; line-height:1.5;
  }
  .seo-inp:focus { border-color:#1a1a1a; background:#fff; }
  .seo-inp::placeholder { color:#ccc; }
  .seo-hint { font-size:11px; color:#bbb; margin-top:4px; line-height:1.45; }
  .slug-wrap { display:flex; align-items:center; border:1.5px solid #eceae5; border-radius:7px; background:#faf9f7; overflow:hidden; transition:border-color .15s,background .15s; }
  .slug-wrap:focus-within { border-color:#1a1a1a; background:#fff; }
  .slug-prefix { font-size:12px; color:#bbb; padding:8px 0 8px 11px; white-space:nowrap; font-family:'JetBrains Mono',monospace; flex-shrink:0; }
  .slug-inp { border:none; outline:none; background:transparent; padding:8px 11px 8px 4px; font-size:13px; font-family:'JetBrains Mono',monospace; color:#1a1a1a; flex:1; min-width:0; }
  .slug-inp::placeholder { color:#ccc; }
  .seo-radio-group { display:flex; gap:6px; flex-wrap:wrap; }
  .seo-radio { display:none; }
  .seo-radio-label { font-size:12px; font-weight:500; color:#666; border:1.5px solid #eceae5; border-radius:6px; padding:5px 11px; cursor:pointer; transition:all .12s; background:#faf9f7; user-select:none; }
  .seo-radio:checked + .seo-radio-label { border-color:#1a1a1a; background:#1a1a1a; color:#fff; }
  .seo-radio-label:hover { border-color:#bbb; }
  .seo-toggle-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .seo-toggle-name { font-size:12px; font-weight:500; color:#555; }
  .seo-toggle-desc { font-size:11px; color:#bbb; margin-top:1px; }
  .toggle-switch { position:relative; width:36px; height:20px; flex-shrink:0; }
  .toggle-switch input { opacity:0; width:0; height:0; position:absolute; }
  .toggle-track { position:absolute; inset:0; background:#e0dbd4; border-radius:10px; cursor:pointer; transition:background .2s; }
  .toggle-track::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2); transition:transform .2s; }
  .toggle-switch input:checked ~ .toggle-track { background:#1a1a1a; }
  .toggle-switch input:checked ~ .toggle-track::after { transform:translateX(16px); }
  .serp-preview { margin:0 20px 16px; padding:14px 16px; border:1.5px solid #eceae5; border-radius:8px; background:#faf9f7; }
  .serp-label { font-size:10px; font-weight:600; color:#bbb; letter-spacing:.08em; text-transform:uppercase; margin-bottom:10px; }
  .serp-url   { font-size:12px; color:#1a6e37; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .serp-title { font-size:16px; color:#1a0dab; font-weight:400; line-height:1.3; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .serp-desc  { font-size:13px; color:#4d5156; line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .seo-score-row { display:flex; align-items:center; gap:10px; padding:14px 20px; border-top:1px solid #f0ede8; flex-shrink:0; }
  .seo-score-bar-wrap { flex:1; height:4px; background:#f0ede8; border-radius:2px; overflow:hidden; }
  .seo-score-bar { height:100%; border-radius:2px; transition:width .4s ease,background .4s; }
  .seo-score-label { font-size:12px; font-weight:600; white-space:nowrap; }

  /* LINK EMBED PROMPT */
  .lp { position:fixed; z-index:300; background:#fff; border-radius:10px; border:1px solid #e8e4de; box-shadow:0 8px 30px rgba(0,0,0,.13); padding:14px 16px; width:320px; transition:opacity .15s,transform .15s; }
  .lp.off { opacity:0; pointer-events:none; transform:translateY(4px); }
  .lp.on  { opacity:1; pointer-events:all; transform:translateY(0); }
  .lp-label { font-size:13px; font-weight:600; color:#1a1a1a; margin-bottom:5px; }
  .lp-url { font-size:11px; color:#aaa; margin-bottom:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:'JetBrains Mono',monospace; }
  .lp-acts { display:flex; gap:7px; }
  .lpb { flex:1; padding:7px 0; border-radius:6px; border:none; cursor:pointer; font-size:12px; font-family:'DM Sans',sans-serif; font-weight:500; transition:opacity .1s; }
  .lpb:hover { opacity:.8; }
  .lpb-embed { background:#1a1a1a; color:#fff; }
  .lpb-link  { background:#f0ede8; color:#555; }
  .lpb-keep  { background:none; color:#aaa; border:1px solid #e8e4de; }

  /* EMBED CARDS */
  .ecard { display:flex; align-items:stretch; border:1px solid #e8e4de; border-radius:10px; margin:28px 0; overflow:hidden; text-decoration:none; color:#1a1a1a; background:#fff; font-family:'DM Sans',sans-serif; transition:box-shadow .15s; }
  .ecard:hover { box-shadow:0 4px 16px rgba(0,0,0,.07); }
  .ecard-body { flex:1; padding:16px 18px; min-width:0; display:flex; flex-direction:column; justify-content:center; }
  .ecard-domain { font-size:11px; color:#aaa; margin-bottom:5px; }
  .ecard-title  { font-size:15px; font-weight:600; line-height:1.35; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ecard-url    { font-size:12px; color:#bbb; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ecard-icon   { width:80px; flex-shrink:0; background:#f5f2ee; display:flex; align-items:center; justify-content:center; font-size:26px; }
  .tw-card { border:1px solid #e8e4de; border-radius:12px; padding:18px 20px; margin:28px 0; background:#fff; font-family:'DM Sans',sans-serif; }
  .tw-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .tw-avatar { width:38px; height:38px; border-radius:50%; background:#e8f5fd; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
  .tw-name { font-size:14px; font-weight:600; line-height:1.2; }
  .tw-handle { font-size:12px; color:#888; }
  .tw-x-logo { margin-left:auto; font-size:17px; font-weight:900; color:#1a1a1a; }
  .tw-body { font-size:15px; line-height:1.55; color:#292929; margin-bottom:10px; }
  .tw-footer { font-size:12px; }
  .tw-footer a { color:#1d9bf0; text-decoration:none; }
  .ig-card { border:1px solid #e8e4de; border-radius:12px; overflow:hidden; margin:28px 0; background:#fff; font-family:'DM Sans',sans-serif; max-width:420px; }
  .ig-header { display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid #f5f2ee; }
  .ig-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); display:flex; align-items:center; justify-content:center; font-size:14px; color:#fff; }
  .ig-name { font-size:13px; font-weight:600; flex:1; }
  .ig-badge { font-size:11px; color:#aaa; background:#f5f2ee; border-radius:4px; padding:2px 7px; }
  .ig-preview { width:100%; aspect-ratio:1/1; background:linear-gradient(135deg,#f09433 0%,#dc2743 50%,#bc1888 100%); display:flex; align-items:center; justify-content:center; font-size:48px; max-height:240px; }
  .ig-footer { padding:12px 14px; }
  .ig-footer a { color:#00376b; font-size:13px; font-weight:500; text-decoration:none; }

  /* SLASH MENU */
  .smenu { position:fixed; z-index:300; background:#fff; border-radius:10px; border:1px solid #e8e4de; box-shadow:0 8px 30px rgba(0,0,0,.11); width:248px; overflow:hidden; transition:opacity .15s,transform .15s; }
  .smenu.off { opacity:0; pointer-events:none; transform:translateY(4px); }
  .smenu.on  { opacity:1; pointer-events:all; transform:translateY(0); }
  .smenu-hdr { padding:9px 14px 5px; font-size:10px; font-weight:500; color:#bbb; letter-spacing:.08em; text-transform:uppercase; }
  .si { display:flex; align-items:center; gap:10px; padding:7px 12px; cursor:pointer; transition:background .1s; }
  .si:hover,.si.sel { background:#f5f2ee; }
  .si-icon { width:30px; height:30px; background:#f0ede8; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; font-family:'JetBrains Mono',monospace; flex-shrink:0; color:#666; }
  .si-name { font-size:13px; color:#1a1a1a; font-weight:500; }
  .si-desc { font-size:11px; color:#bbb; margin-top:1px; }

  /* COVER ZONE */
  .cover-zone { position:relative; margin-bottom:36px; }
  .cover-hint { display:flex; align-items:center; gap:7px; color:#ccc; font-size:13px; font-family:'DM Sans',sans-serif; cursor:pointer; padding:8px 0; width:fit-content; border:none; background:none; transition:color .15s; }
  .cover-hint:hover { color:#999; }
  .cover-img-wrap { position:relative; border-radius:10px; overflow:hidden; }
  .cover-img { width:100%; max-height:420px; min-height:200px; object-fit:cover; display:block; }
  .cover-actions { position:absolute; bottom:12px; right:12px; display:flex; gap:6px; opacity:0; transition:opacity .2s; }
  .cover-img-wrap:hover .cover-actions { opacity:1; }
  .cover-act-btn { background:rgba(255,255,255,.92); border:none; border-radius:6px; padding:5px 11px; font-size:12px; font-family:'DM Sans',sans-serif; font-weight:500; color:#1a1a1a; cursor:pointer; backdrop-filter:blur(4px); }
  .cover-act-btn:hover { background:#fff; }

  /* CATEGORIES */
  .cat-section { margin-top:48px; padding-top:32px; border-top:1px solid #eceae5; }
  .cat-title { font-size:13px; font-weight:600; color:#555; margin-bottom:4px; font-family:'DM Sans',sans-serif; }
  .cat-sub { font-size:12px; color:#bbb; margin-bottom:16px; font-family:'DM Sans',sans-serif; }
  .cat-grid { display:flex; flex-wrap:wrap; gap:8px; }
  .cat-btn {
    padding:6px 14px; border-radius:20px; font-size:13px; font-family:'DM Sans',sans-serif;
    font-weight:500; cursor:pointer; border:1.5px solid #eceae5;
    background:#faf9f7; color:#666; transition:all .12s;
  }
  .cat-btn:hover { border-color:#aaa; color:#1a1a1a; }
  .cat-btn.active { background:#1a1a1a; color:#fff; border-color:#1a1a1a; }
  .cat-error { font-size:12px; color:#ef4444; margin-top:10px; font-family:'DM Sans',sans-serif; }

  /* EDITOR AREA */
  .ew { max-width:680px; margin:0 auto; padding:40px 24px 80px; transition:margin-right .35s cubic-bezier(.4,0,.2,1); }
  .ew.seo-open { margin-right:380px; }

  .title-inp { width:100%; border:none; outline:none; background:transparent; resize:none; overflow:hidden; font-family:'Lora',serif; font-size:clamp(26px,5vw,40px); font-weight:600; line-height:1.2; color:#1a1a1a; letter-spacing:-.5px; margin-bottom:8px; }
  .title-inp::placeholder { color:#ccc; }
  .sub-inp { width:100%; border:none; outline:none; background:transparent; resize:none; overflow:hidden; font-family:'Lora',serif; font-style:italic; font-size:19px; line-height:1.5; color:#999; margin-bottom:36px; }
  .sub-inp::placeholder { color:#ccc; }
  .div-line { height:1px; background:#eceae5; margin-bottom:36px; }

  .ec { min-height:400px; outline:none; font-family:'Lora',serif; font-size:18px; line-height:1.78; color:#292929; letter-spacing:.01em; caret-color:#1a1a1a; }
  .ec:empty::before { content:attr(data-placeholder); color:#ccc; pointer-events:none; }
  .ec h1 { font-size:33px; font-weight:600; line-height:1.2; margin:38px 0 14px; letter-spacing:-.3px; font-family:'Lora',serif; }
  .ec h2 { font-size:25px; font-weight:600; line-height:1.3; margin:30px 0 11px; font-family:'Lora',serif; }
  .ec h3 { font-size:21px; font-weight:600; line-height:1.35; margin:26px 0 9px; font-family:'Lora',serif; }
  .ec h4 { font-size:17px; font-weight:600; line-height:1.4; margin:20px 0 7px; font-family:'Lora',serif; }
  .ec p { margin-bottom:22px; }
  .ec blockquote { border-left:3px solid #1a1a1a; margin:30px 0; padding:2px 0 2px 22px; font-style:italic; font-size:20px; color:#666; line-height:1.6; }
  .ec pre { background:#f0ede8; border-radius:8px; padding:18px 22px; margin:26px 0; overflow-x:auto; }
  .ec code { font-family:'JetBrains Mono',monospace; font-size:14px; color:#1a1a1a; line-height:1.7; }
  .ec p code { background:#f0ede8; padding:2px 6px; border-radius:4px; font-size:85%; }
  .ec img { max-width:100%; border-radius:6px; margin:26px 0; display:block; }
  .ec a { color:#1a1a1a; text-decoration:underline; }
  .ec hr { border:none; border-top:1px solid #eceae5; margin:36px 0; }
  .ec ul { list-style-type:disc !important; padding-left:28px; margin-bottom:22px; }
  .ec ol { list-style-type:decimal !important; padding-left:28px; margin-bottom:22px; }
  .ec li { margin-bottom:6px; color:#292929; display:list-item !important; }
  .ec ul li::marker { color:#292929 !important; }
  .ec ol li::marker { color:#292929 !important; }

  .wc { position:fixed; bottom:26px; right:26px; font-size:12px; color:#ccc; font-family:'DM Sans',sans-serif; transition:right .35s cubic-bezier(.4,0,.2,1); }
  .wc.seo-open { right:406px; }

  /* TOAST */
  .toast {
    position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(10px);
    background:#1a1a1a; color:#fff; padding:10px 20px; border-radius:8px;
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,.2); z-index:400;
    opacity:0; transition:opacity .2s, transform .2s; pointer-events:none;
  }
  .toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
  .toast.error { background:#ef4444; }
`;

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const URL_RE = /^https?:\/\/\S{4,}$/i;

const SLASH_CMDS = [
  { icon: "H1", label: "Heading 1", desc: "Large heading", tag: "h1" },
  { icon: "H2", label: "Heading 2", desc: "Medium heading", tag: "h2" },
  { icon: "H3", label: "Heading 3", desc: "Small heading", tag: "h3" },
  { icon: "H4", label: "Heading 4", desc: "Subtle heading", tag: "h4" },
  { icon: "❝", label: "Quote", desc: "Pull quote", tag: "blockquote" },
  { icon: "</>", label: "Code", desc: "Code block", tag: "pre" },
  { icon: "—", label: "Divider", desc: "Horizontal rule", tag: "hr" },
  { icon: "🖼", label: "Image", desc: "Upload image", tag: "img" },
  { icon: "•", label: "Bullet List", desc: "Unordered list", tag: "ul" },
  { icon: "1.", label: "Numbered List", desc: "Ordered list", tag: "ol" },
];

const CATEGORIES = [
  "Technology", "AI", "Startups", "Business", "Programming",
  "Design", "Productivity", "Finance", "Marketing",
  "Health", "Career", "Sports", "Science", "Writing",
];

/* ─────────────────────────────────────────
   EMBED HELPERS
───────────────────────────────────────── */
function detectPlatform(url) {
  try {
    const h = new URL(url).hostname.replace("www.", "");
    if (h.includes("twitter.com") || h.includes("x.com")) return "twitter";
    if (h.includes("instagram.com")) return "instagram";
    return "generic";
  } catch { return "generic"; }
}
function buildEmbedHTML(url) {
  const p = detectPlatform(url);
  if (p === "twitter") {
    const parts = (() => { try { return new URL(url).pathname.split("/").filter(Boolean); } catch { return []; } })();
    const handle = parts[0] || "user";
    return `<div class="tw-card" contenteditable="false"><div class="tw-header"><div class="tw-avatar">🐦</div><div><div class="tw-name">@${handle}</div><div class="tw-handle">Twitter / X</div></div><div class="tw-x-logo">𝕏</div></div><div class="tw-body">View this post on X →</div><div class="tw-footer"><a href="${url}" target="_blank">${url}</a></div></div><p><br></p>`;
  }
  if (p === "instagram") {
    const parts = (() => { try { return new URL(url).pathname.split("/").filter(Boolean); } catch { return []; } })();
    const isReel = parts[0] === "reel";
    return `<div class="ig-card" contenteditable="false"><div class="ig-header"><div class="ig-avatar">📸</div><div class="ig-name">Instagram</div><div class="ig-badge">${isReel ? "Reel" : "Post"}</div></div><div class="ig-preview">${isReel ? "🎬" : "🖼️"}</div><div class="ig-footer"><a href="${url}" target="_blank">View on Instagram →</a></div></div><p><br></p>`;
  }
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    const icons = { "github.com": "⌨️", "medium.com": "Ⓜ️", "linkedin.com": "💼", "reddit.com": "🔴", "spotify.com": "🎵", "notion.so": "📝", "youtube.com": "▶️", "youtu.be": "▶️" };
    const icon = icons[domain] || "🔗";
    return `<a class="ecard" href="${url}" target="_blank" rel="noopener" contenteditable="false"><div class="ecard-body"><div class="ecard-domain">${domain}</div><div class="ecard-title">${domain}</div><div class="ecard-url">${url}</div></div><div class="ecard-icon">${icon}</div></a><p><br></p>`;
  } catch { return `<a href="${url}" target="_blank">${url}</a>`; }
}

/* ─────────────────────────────────────────
   FORMAT HELPERS
───────────────────────────────────────── */
function getBlock() { try { return document.queryCommandValue("formatBlock").toLowerCase() || "p"; } catch { return "p"; } }
function getFmts() {
  try { return { bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline"), strike: document.queryCommandState("strikeThrough"), block: getBlock() }; }
  catch { return { block: "p" }; }
}
function toggleBlock(tag) { document.execCommand("formatBlock", false, getBlock() === tag ? "p" : tag); }

/* ─────────────────────────────────────────
   SEO SCORE
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

/* ─────────────────────────────────────────
   SLUG GENERATOR
───────────────────────────────────────── */
function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

/* ═══════════════════════════════════════
   COMPONENT
═══════════════════════════════════════ */
export default function WritePage() {
  const loadingBarRef = useRef(null);
  const { user } = useAuthContext();
  const router = useRouter();

  /* editor refs */
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const imgRef = useRef(null);
  const coverRef = useRef(null);
  const slashRanRef = useRef(null);
  const savedSelRef = useRef(null);
  const hBtnRef = useRef(null);

  /* editor state */
  const [cover, setCover] = useState(null);       // dataURL for preview
  const [coverUrl, setCoverUrl] = useState("");        // supabase public URL
  const [fmt, setFmt] = useState({ block: "p" });
  const [hMenu, setHMenu] = useState({ on: false, x: 0, y: 0 });
  const [slash, setSlash] = useState({ on: false, x: 0, y: 0, filter: "", idx: 0 });
  const [lp, setLp] = useState({ on: false, x: 0, y: 0, url: "" });
  const [wc, setWc] = useState(0);
  const [seoOpen, setSeoOpen] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "ok", show: false });

  /* form state */
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [selCats, setSelCats] = useState([]);
  const [catError, setCatError] = useState("");
  const [publishing, setPublishing] = useState(false);

  /* SEO state */
  const [seo, setSeo] = useState({
    metaTitle: "", metaDesc: "", slug: "", canonical: "",
    ogTitle: "", ogDesc: "", robots: "index",
    twitterCard: true, schemaType: "article", focusKw: "", nofollow: false,
  });
  const setSeoField = (k, v) => setSeo(s => ({ ...s, [k]: v }));

  /* ── toast helper ── */
  const showToast = (msg, type = "ok") => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  /* ── auto-resize textareas ── */
  const ar = el => { if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; };

  const refFmt = () => setFmt(getFmts());
  const savesel = () => { const s = window.getSelection(); if (s && s.rangeCount) savedSelRef.current = s.getRangeAt(0).cloneRange(); };
  const restoresel = () => { const s = window.getSelection(); if (s && savedSelRef.current) { s.removeAllRanges(); s.addRange(savedSelRef.current); } };

  /* ── close menus on outside click ── */
  useEffect(() => {
    const fn = e => {
      if (!e.target.closest(".hsub") && !e.target.closest(".hbtn")) setHMenu(h => ({ ...h, on: false }));
      if (!e.target.closest(".lp")) setLp(l => ({ ...l, on: false }));
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* ── format helpers ── */
  const run = (cmd, val = null) => { restoresel(); document.execCommand(cmd, false, val); editorRef.current?.focus(); refFmt(); };
  const openHMenu = e => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setHMenu(h => ({ on: !h.on, x: r.left, y: r.bottom + 6 })); };
  const applyH = tag => { restoresel(); toggleBlock(tag); editorRef.current?.focus(); refFmt(); setHMenu(h => ({ ...h, on: false })); };
  const applyQuote = e => { e.preventDefault(); toggleBlock("blockquote"); editorRef.current?.focus(); refFmt(); };

  /* ── slash command key handler ── */
  const onKeyDown = e => {
    if (!slash.on) return;
    const fc = SLASH_CMDS.filter(c => c.label.toLowerCase().includes(slash.filter.toLowerCase()));
    if (e.key === "ArrowDown") { e.preventDefault(); setSlash(s => ({ ...s, idx: Math.min(s.idx + 1, fc.length - 1) })); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSlash(s => ({ ...s, idx: Math.max(s.idx - 1, 0) })); }
    else if (e.key === "Enter") { e.preventDefault(); insertBlock(fc[slash.idx]); }
    else if (e.key === "Escape") { setSlash(s => ({ ...s, on: false })); }
  };

  const onInput = () => {
    const text = editorRef.current?.innerText || "";
    setWc(text.trim().split(/\s+/).filter(Boolean).length);
    // sync title to SEO slug if slug is empty
    setTitle(titleRef.current?.value || "");
    setFmt(getFmts());
    const sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0); const node = range.startContainer;
    const tb2 = (node.textContent || "").slice(0, range.startOffset);
    const si = tb2.lastIndexOf("/");
    if (si !== -1 && !tb2.slice(0, si).trim()) {
      const filter = tb2.slice(si + 1);
      if (!filter.includes(" ")) {
        const rect = range.getBoundingClientRect();
        const r2 = range.cloneRange(); r2.setStart(node, si); slashRanRef.current = r2;
        setSlash({ on: true, x: rect.left, y: rect.bottom + window.scrollY + 6, filter, idx: 0 }); return;
      }
    }
    setSlash(s => ({ ...s, on: false }));
  };

  const insertBlock = cmd => {
    setSlash(s => ({ ...s, on: false })); editorRef.current?.focus();
    if (slashRanRef.current) { const s = window.getSelection(); if (s) { s.removeAllRanges(); const d = slashRanRef.current.cloneRange(); d.deleteContents(); s.addRange(d); } }
    if (cmd.tag === "img") { imgRef.current?.click(); return; }
    if (cmd.tag === "hr") { document.execCommand("insertHTML", false, "<hr/><p><br></p>"); return; }
    if (cmd.tag === "pre") { document.execCommand("insertHTML", false, "<pre><code>// code here</code></pre><p><br></p>"); return; }
    if (cmd.tag === "ul") { document.execCommand("insertUnorderedList"); return; }
    if (cmd.tag === "ol") { document.execCommand("insertOrderedList"); return; }
    if (cmd.tag === "blockquote") { document.execCommand("formatBlock", false, "blockquote"); return; }
    document.execCommand("formatBlock", false, cmd.tag);
  };

  /* ── paste: detect URL ── */
  const onPaste = e => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").trim();
    if (URL_RE.test(text)) {
      const s = window.getSelection(); const cr = s?.rangeCount ? s.getRangeAt(0).getBoundingClientRect() : null;
      document.execCommand("insertText", false, text);
      setLp({ on: true, url: text, x: Math.max(8, cr?.left || 80), y: (cr?.bottom || 160) + window.scrollY + 10 }); return;
    }
    document.execCommand("insertText", false, text);
  };

  const doEmbed = url => { setLp(l => ({ ...l, on: false })); editorRef.current?.focus(); editorRef.current.innerHTML = editorRef.current.innerHTML.replace(url, buildEmbedHTML(url)); };
  const doLinkify = url => { setLp(l => ({ ...l, on: false })); editorRef.current.innerHTML = editorRef.current.innerHTML.replace(url, `<a href="${url}" target="_blank">${url}</a>`); };

  /* ── cover image upload to Supabase ── */
  const onCoverFile = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    // local preview immediately
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
      showToast("Cover upload failed: " + err.message, "error");
    }
    e.target.value = "";
  };

  /* ── inline image upload to Supabase ── */
  const onImgFile = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const fileName = `inline/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("article-images").upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("article-images").getPublicUrl(fileName);
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, `<img src="${data.publicUrl}" alt=""/><p><br></p>`);
    } catch (err) {
      showToast("Image upload failed: " + err.message, "error");
    }
    e.target.value = "";
  };

  /* ── category toggle ── */
  const toggleCat = cat => {
    setCatError("");
    setSelCats(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      if (prev.length >= 5) return prev;
      return [...prev, cat];
    });
  };

  /* ── save draft ── */
  const saveDraft = async () => {
    try {
      const { error } = await supabase.from("articles").insert([{
        title: title || "Untitled draft",
        content: editorRef.current?.innerHTML || "",
        meta_description: shortDesc,
        author_id: user.id,
        cover_image: coverUrl,
        categories: selCats,
        status: "draft",
        // SEO fields
        seo_title: seo.metaTitle || null,
        seo_description: seo.metaDesc || null,
        seo_slug: seo.slug || null,
        canonical_url: seo.canonical || null,
        og_title: seo.ogTitle || null,
        og_description: seo.ogDesc || null,
        robots: seo.robots,
        twitter_card: seo.twitterCard,
        schema_type: seo.schemaType,
        focus_keyword: seo.focusKw || null,
        nofollow_links: seo.nofollow,
      }]);
      if (error) throw error;
      showToast("Draft saved");
      router.push("/stories");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  /* ── publish article ── */
  const publishArticle = async () => {
    if (selCats.length < 3) { setCatError("Please select at least 3 categories"); return; }
    try {
      setPublishing(true);
      loadingBarRef.current?.continuousStart();

      // use custom SEO slug if provided, else auto-generate from title
      const slug = seo.slug || generateSlug(title);

      const { error } = await supabase.from("articles").insert([{
        title: title || "Untitled article",
        content: editorRef.current?.innerHTML || "",
        meta_description: shortDesc,
        slug,
        author_id: user.id,
        cover_image: coverUrl,
        categories: selCats,
        status: "published",
        view_count: 0,
        like_count: 0,
        bookmark_count: 0,
        // SEO fields
        seo_title: seo.metaTitle || null,
        seo_description: seo.metaDesc || null,
        seo_slug: seo.slug || null,
        canonical_url: seo.canonical || null,
        og_title: seo.ogTitle || null,
        og_description: seo.ogDesc || null,
        robots: seo.robots,
        twitter_card: seo.twitterCard,
        schema_type: seo.schemaType,
        focus_keyword: seo.focusKw || null,
        nofollow_links: seo.nofollow,
      }]);

      if (error) throw error;
      loadingBarRef.current?.complete();
      setPublishing(false);
      showToast("Published!");
      router.push(`/read/${slug}`);
    } catch (err) {
      showToast(err.message, "error");
      setPublishing(false);
      loadingBarRef.current?.complete();
    }
  };

  /* ── derived ── */
  const fc = SLASH_CMDS.filter(c => c.label.toLowerCase().includes(slash.filter.toLowerCase()));
  const hActive = ["h1", "h2", "h3", "h4"].includes(fmt.block);
  const hLabel = hActive ? fmt.block.toUpperCase() : "H";
  const score = calcSeoScore(seo);
  const seoFilled = seo.metaTitle.trim() || seo.metaDesc.trim() || seo.slug.trim();
  const serpUrl = seo.canonical || `yoursite.com/${seo.slug || "article-slug"}`;
  const serpTitle = seo.metaTitle || title || "Page Title";
  const serpDesc = seo.metaDesc || "Add a meta description to control how this page appears in search results.";

  /* ═════════════════════════════════════
     RENDER
  ═════════════════════════════════════ */
  return (
    <>
      <style>{css}</style>
      <LoadingBar color="#16a34a" ref={loadingBarRef} />

      <div className="es">

        {/* TOPBAR */}
        <div className="topbar">
          <Link className="topbar-left" href="/stories">
            <div className="topbar-dot" />
            <span>View drafts</span>
            <GoChevronRight size={16} />
          </Link>
          <div className="topbar-right">
            <button className={`btn-seo ${seoOpen ? "active" : ""}`} onClick={() => setSeoOpen(o => !o)}>
              <div className={`seo-dot ${seoFilled ? "" : "empty"}`} />
              SEO
            </button>
            <button className="btn-ghost" onClick={saveDraft}>Save draft</button>
            <button className="btn-pub" onClick={publishArticle} disabled={publishing}>
              <span>{publishing ? "Publishing…" : "Publish"}</span>
              <MdArrowOutward size={16} />
            </button>
          </div>
        </div>

        {/* FORMAT BAR */}
        <div className={`fbar ${seoOpen ? "seo-open" : ""}`}>
          <button className={`fb ${fmt.bold ? "on" : ""}`} onMouseDown={e => { e.preventDefault(); savesel(); run("bold") }} title="Bold"><strong>B</strong></button>
          <button className={`fb ${fmt.italic ? "on" : ""}`} onMouseDown={e => { e.preventDefault(); savesel(); run("italic") }} title="Italic"><em>I</em></button>
          <button className={`fb ${fmt.underline ? "on" : ""}`} onMouseDown={e => { e.preventDefault(); savesel(); run("underline") }} title="Underline"><u>U</u></button>
          <button className={`fb ${fmt.strike ? "on" : ""}`} onMouseDown={e => { e.preventDefault(); savesel(); run("strikeThrough") }} title="Strike"><s>S</s></button>
          <div className="fb-sep" />
          <button ref={hBtnRef} className={`fb hbtn ${hActive ? "on" : ""}`} onMouseDown={openHMenu}>{hLabel}</button>
          <button className={`fb ${fmt.block === "blockquote" ? "on" : ""}`} onMouseDown={applyQuote} title="Quote">❝</button>
          <button className={`fb ${fmt.block === "pre" ? "on" : ""}`} onMouseDown={e => { e.preventDefault(); toggleBlock("pre"); editorRef.current?.focus(); refFmt(); }} title="Code">&lt;/&gt;</button>
          <div className="fb-sep" />
          <button className="fb" onMouseDown={e => { e.preventDefault(); run("insertUnorderedList") }} title="Bullet">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="6" r="2" /><rect x="8" y="5" width="13" height="2" rx="1" /><circle cx="4" cy="12" r="2" /><rect x="8" y="11" width="13" height="2" rx="1" /><circle cx="4" cy="18" r="2" /><rect x="8" y="17" width="13" height="2" rx="1" /></svg>
          </button>
          <button className="fb" onMouseDown={e => { e.preventDefault(); run("insertOrderedList") }} title="Numbered">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><text x="2" y="8" fontSize="7" fontFamily="sans-serif" fontWeight="700">1.</text><rect x="10" y="5" width="11" height="2" rx="1" /><text x="2" y="14" fontSize="7" fontFamily="sans-serif" fontWeight="700">2.</text><rect x="10" y="11" width="11" height="2" rx="1" /><text x="2" y="20" fontSize="7" fontFamily="sans-serif" fontWeight="700">3.</text><rect x="10" y="17" width="11" height="2" rx="1" /></svg>
          </button>
          <div className="fb-sep" />
          <button className="fb" onMouseDown={e => { e.preventDefault(); savesel(); const u = prompt("URL:"); if (u) { restoresel(); run("createLink", u); } }} title="Link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
          </button>
          <button className="fb" onMouseDown={e => { e.preventDefault(); imgRef.current?.click(); }} title="Image">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
          </button>
        </div>

        {/* HEADING SUBMENU */}
        <div className={`hsub ${hMenu.on ? "on" : "off"}`} style={{ left: hMenu.x, top: hMenu.y }}>
          {["h1", "h2", "h3", "h4"].map(tag => (
            <button key={tag} className={`hsb ${fmt.block === tag ? "on" : ""}`} onMouseDown={e => { e.preventDefault(); applyH(tag); }}>{tag.toUpperCase()}</button>
          ))}
          <button className={`hsb ${!hActive ? "on" : ""}`} style={{ fontSize: 13 }} onMouseDown={e => { e.preventDefault(); restoresel(); document.execCommand("formatBlock", false, "p"); editorRef.current?.focus(); refFmt(); setHMenu(h => ({ ...h, on: false })); }}>¶</button>
        </div>

        {/* SEO DRAWER */}
        <div className={`seo-drawer ${seoOpen ? "open" : ""}`}>
          <div className="seo-head">
            <div>
              <div className="seo-head-title">SEO Settings</div>
              <div className="seo-head-sub">Optimize for search engines</div>
            </div>
            <button className="seo-close" onClick={() => setSeoOpen(false)}>✕</button>
          </div>

          <div className="seo-body">
            {/* SERP Preview */}
            <div className="seo-section"><div className="seo-section-label">Search Preview</div></div>
            <div className="serp-preview">
              <div className="serp-label">Google Preview</div>
              <div className="serp-url">{serpUrl}</div>
              <div className="serp-title">{serpTitle}</div>
              <div className="serp-desc">{serpDesc}</div>
            </div>

            {/* Basic SEO */}
            <div className="seo-section">
              <div className="seo-section-label">Basic SEO</div>
              <div className="seo-field">
                <div className="seo-label">Focus Keyword</div>
                <input className="seo-inp" placeholder="e.g. react editor tutorial" value={seo.focusKw} onChange={e => setSeoField("focusKw", e.target.value)} />
                <div className="seo-hint">The main keyword you want this page to rank for.</div>
              </div>
              <div className="seo-field">
                <div className="seo-label">Meta Title <span className={`seo-label-count ${seo.metaTitle.length > 60 ? "over" : seo.metaTitle.length > 50 ? "warn" : ""}`}>{seo.metaTitle.length}/60</span></div>
                <input className="seo-inp" placeholder="Page title for search engines…" value={seo.metaTitle} onChange={e => setSeoField("metaTitle", e.target.value)} maxLength={80} />
                <div className="seo-hint">Ideal: 30–60 characters.</div>
              </div>
              <div className="seo-field">
                <div className="seo-label">Meta Description <span className={`seo-label-count ${seo.metaDesc.length > 160 ? "over" : seo.metaDesc.length > 140 ? "warn" : ""}`}>{seo.metaDesc.length}/160</span></div>
                <textarea className="seo-inp" rows={3} placeholder="Brief summary for search results…" value={seo.metaDesc} onChange={e => setSeoField("metaDesc", e.target.value)} maxLength={200} />
                <div className="seo-hint">Ideal: 120–160 characters.</div>
              </div>
              <div className="seo-field">
                <div className="seo-label">URL Slug</div>
                <div className="slug-wrap">
                  <span className="slug-prefix">yoursite.com/</span>
                  <input className="slug-inp" placeholder="article-url-slug" value={seo.slug} onChange={e => setSeoField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} />
                </div>
                <div className="seo-hint">Leave empty to auto-generate from title.</div>
              </div>
            </div>

            {/* Open Graph */}
            <div className="seo-section">
              <div className="seo-section-label">Open Graph (Social)</div>
              <div className="seo-field">
                <div className="seo-label">OG Title <span className={`seo-label-count ${seo.ogTitle.length > 90 ? "over" : ""}`}>{seo.ogTitle.length}/90</span></div>
                <input className="seo-inp" placeholder="Title for social sharing…" value={seo.ogTitle} onChange={e => setSeoField("ogTitle", e.target.value)} maxLength={100} />
              </div>
              <div className="seo-field">
                <div className="seo-label">OG Description <span className={`seo-label-count ${seo.ogDesc.length > 200 ? "over" : ""}`}>{seo.ogDesc.length}/200</span></div>
                <textarea className="seo-inp" rows={2} placeholder="Description for social link previews…" value={seo.ogDesc} onChange={e => setSeoField("ogDesc", e.target.value)} maxLength={220} />
              </div>
              <div className="seo-field">
                <div className="seo-toggle-row">
                  <div><div className="seo-toggle-name">Twitter Card</div><div className="seo-toggle-desc">Large image preview on X</div></div>
                  <label className="toggle-switch"><input type="checkbox" checked={seo.twitterCard} onChange={e => setSeoField("twitterCard", e.target.checked)} /><div className="toggle-track" /></label>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="seo-section">
              <div className="seo-section-label">Advanced</div>
              <div className="seo-field">
                <div className="seo-label">Canonical URL</div>
                <input className="seo-inp" placeholder="https://yoursite.com/article-slug" value={seo.canonical} onChange={e => setSeoField("canonical", e.target.value)} />
                <div className="seo-hint">Set to prevent duplicate content penalties.</div>
              </div>
              <div className="seo-field">
                <div className="seo-label">Robots</div>
                <div className="seo-radio-group">
                  {["index", "noindex", "noindex, nofollow"].map(v => (
                    <label key={v}><input type="radio" className="seo-radio" name="robots" value={v} checked={seo.robots === v} onChange={() => setSeoField("robots", v)} /><span className="seo-radio-label">{v}</span></label>
                  ))}
                </div>
              </div>
              <div className="seo-field">
                <div className="seo-label">Schema Type</div>
                <div className="seo-radio-group">
                  {["article", "blogposting", "webpage", "none"].map(v => (
                    <label key={v}><input type="radio" className="seo-radio" name="schema" value={v} checked={seo.schemaType === v} onChange={() => setSeoField("schemaType", v)} /><span className="seo-radio-label">{v}</span></label>
                  ))}
                </div>
              </div>
              <div className="seo-field">
                <div className="seo-toggle-row">
                  <div><div className="seo-toggle-name">No-follow all links</div><div className="seo-toggle-desc">Adds rel="nofollow" to outbound links</div></div>
                  <label className="toggle-switch"><input type="checkbox" checked={seo.nofollow} onChange={e => setSeoField("nofollow", e.target.checked)} /><div className="toggle-track" /></label>
                </div>
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="seo-score-row">
            <div className="seo-score-bar-wrap"><div className="seo-score-bar" style={{ width: `${score}%`, background: scoreColor(score) }} /></div>
            <div className="seo-score-label" style={{ color: scoreColor(score) }}>{score}% · {scoreLabel(score)}</div>
          </div>
        </div>

        {/* LINK EMBED PROMPT */}
        <div className={`lp ${lp.on ? "on" : "off"}`} style={{ left: Math.min(lp.x, window.innerWidth - 336), top: lp.y }}>
          <div className="lp-label">🔗 Link detected</div>
          <div className="lp-url">{lp.url}</div>
          <div className="lp-acts">
            <button className="lpb lpb-embed" onMouseDown={e => { e.preventDefault(); doEmbed(lp.url); }}>Embed card</button>
            <button className="lpb lpb-link" onMouseDown={e => { e.preventDefault(); doLinkify(lp.url); }}>Plain link</button>
            <button className="lpb lpb-keep" onMouseDown={e => { e.preventDefault(); setLp(l => ({ ...l, on: false })); }}>Keep text</button>
          </div>
        </div>

        {/* SLASH MENU */}
        <div className={`smenu ${slash.on ? "on" : "off"}`} style={{ left: slash.x, top: slash.y }}>
          <div className="smenu-hdr">Insert block</div>
          {fc.length === 0
            ? <div style={{ padding: "12px 14px", color: "#bbb", fontSize: 13 }}>No results</div>
            : fc.map((cmd, i) => (
              <div key={cmd.tag} className={`si ${i === slash.idx ? "sel" : ""}`} onMouseDown={e => { e.preventDefault(); insertBlock(cmd); }}>
                <div className="si-icon">{cmd.icon}</div>
                <div><div className="si-name">{cmd.label}</div><div className="si-desc">{cmd.desc}</div></div>
              </div>
            ))
          }
        </div>

        {/* MAIN EDITOR */}
        <div className={`ew ${seoOpen ? "seo-open" : ""}`} style={{ marginTop: "96px" }}>

          {/* Cover zone */}
          <div className={`cover-zone ${cover ? "has-cover" : ""}`}>
            {!cover && (
              <button className="cover-hint" onClick={() => coverRef.current?.click()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                Add cover image
              </button>
            )}
            {cover && (
              <div className="cover-img-wrap">
                <img className="cover-img" src={cover} alt="Cover" />
                <div className="cover-actions">
                  <button className="cover-act-btn" onClick={() => coverRef.current?.click()}>Change</button>
                  <button className="cover-act-btn" onClick={() => { setCover(null); setCoverUrl(""); }}>Remove</button>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <textarea
            ref={titleRef}
            className="title-inp"
            placeholder="Title"
            rows={1}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onInput={e => ar(e.target)}
          />

          {/* Short description */}
          <textarea
            ref={subRef}
            className="sub-inp"
            placeholder="Short description…"
            rows={1}
            value={shortDesc}
            onChange={e => setShortDesc(e.target.value)}
            onInput={e => ar(e.target)}
          />

          <div className="div-line" />

          {/* Content editor */}
          <div
            ref={editorRef}
            className="ec"
            contentEditable suppressContentEditableWarning
            data-placeholder="Write something, or type '/' for commands…"
            onInput={onInput}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onMouseUp={refFmt}
            onKeyUp={refFmt}
          />

          {/* Categories */}
          <div className="cat-section">
            <div className="cat-title">Topics</div>
            <div className="cat-sub">Select 3–5 topics that best describe your article</div>
            <div className="cat-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`cat-btn ${selCats.includes(cat) ? "active" : ""}`}
                  onClick={() => toggleCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            {catError && <div className="cat-error">{catError}</div>}
          </div>

        </div>

        <div className={`wc ${seoOpen ? "seo-open" : ""}`}>{wc} {wc === 1 ? "word" : "words"}</div>

        {/* Toast */}
        <div className={`toast ${toast.type === "error" ? "error" : ""} ${toast.show ? "show" : ""}`}>{toast.msg}</div>

        {/* Hidden file inputs */}
        <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onCoverFile} />
        <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImgFile} />
      </div>
    </>
  );
}