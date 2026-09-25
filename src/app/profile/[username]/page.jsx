"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightStartOnRectangleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { RxShare2 } from "react-icons/rx";
import { FaXTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabaseClient";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { CATEGORIES } from "@/lib/constants";
import { formatDate, getExcerpt, getImageUrl, readingTime, shareLink } from "@/lib/articleUtils";
import Modal from "@/app/components/ui/Modal";
import Avatar from "@/app/components/ui/Avatar";
import Sidebar from "@/app/components/Sidebar";

const SOCIALS = {
  twitter: { label: "X (Twitter)", icon: FaXTwitter, base: "https://x.com/", placeholder: "username" },
  linkedin: { label: "LinkedIn", icon: FaLinkedinIn, base: "https://linkedin.com/in/", placeholder: "username" },
  instagram: { label: "Instagram", icon: FaInstagram, base: "https://instagram.com/", placeholder: "username" },
  website: { label: "Website", icon: HiOutlineGlobeAlt, base: "https://", placeholder: "yoursite.com" },
};

const socialHref = (key, value) => {
  const v = value.trim().replace(/^@/, "");
  return /^https?:\/\//i.test(v) ? v : `${SOCIALS[key].base}${v}`;
};

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

/* ─────────── Small building blocks ─────────── */

function Message({ msg }) {
  if (!msg) return null;
  return (
    <p
      role="status"
      className={`mt-4 rounded-lg px-3 py-2 text-sm ${
        msg.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
      }`}
    >
      {msg.text}
    </p>
  );
}

function ModalActions({ onCancel, onSave, loading, disabled, saveLabel = "Save" }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="rounded-full px-4 py-2 text-sm text-gray-600 hover:text-black"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={loading || disabled}
        className="rounded-full bg-black px-6 py-2 text-sm text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}

function SettingRow({ title, value, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-4 py-6 text-left"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-[15px] font-medium text-black">{title}</h2>
        {value && <p className="line-clamp-2 font-sans text-sm text-gray-500">{value}</p>}
        {children}
      </div>
      <span className="shrink-0 text-sm text-gray-400 transition-colors group-hover:text-black">
        Edit
      </span>
    </button>
  );
}

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-black outline-none transition-colors focus:border-black focus:bg-white";

/* ─────────── Page ─────────── */

function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username } = useParams();
  const { user, loading, signOut, refreshProfile } = useAuthContext();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  // Which modal is open: "name" | "username" | "bio" | "socials" | "interests" | "password" | "avatar" | "about" | null
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [bioText, setBioText] = useState("");
  const [socials, setSocials] = useState({ twitter: "", linkedin: "", instagram: "", website: "" });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [newPassword, setNewPassword] = useState("");

  // ── Fetch profile ──
  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      setProfileLoading(true);
      const handle = decodeURIComponent(username);
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let query = supabase.from("users").select("*");
      query = uuidRegex.test(handle)
        ? query.or(`username.eq.${handle},id.eq.${handle}`)
        : query.eq("username", handle);
      const { data, error } = await query.maybeSingle();
      if (error) console.error("Error fetching profile:", error);
      setProfile(data || null);
      setProfileLoading(false);
    };
    fetchProfile();
  }, [username]);

  // ── Fetch articles ──
  useEffect(() => {
    if (!profile?.id) return;
    const fetchArticles = async () => {
      setArticlesLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", profile.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (!error) setArticles(data || []);
      setArticlesLoading(false);
    };
    fetchArticles();
  }, [profile?.id]);

  const isOwnProfile = !!user && !!profile && user.id === profile.id;
  const isSettingsView = isOwnProfile && searchParams.get("settings") === "true";

  const savedSocials = {
    twitter: profile?.twitter || "",
    linkedin: profile?.linkedin || "",
    instagram: profile?.instagram || "",
    website: profile?.website || "",
  };

  // ── Modal helpers ──
  const openModal = (name) => {
    setMsg(null);
    if (profile) {
      setDisplayName(profile.name || "");
      setNewUsername(profile.username || "");
      setBioText(profile.bio || "");
      setSocials(savedSocials);
      setSelectedInterests(Array.isArray(profile.interests) ? profile.interests : []);
    }
    setNewPassword("");
    setModal(name);
  };
  const closeModal = () => setModal(null);

  const refreshUser = async () => {
    const { data } = await supabase.from("users").select("*").eq("id", profile.id).single();
    if (data) setProfile(data);
    refreshProfile(); // keep navbar avatar/name in sync
    return data;
  };

  /** Update the users row, then close the modal with a toast. */
  const updateUser = async (fields, successText) => {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("users").update(fields).eq("id", user.id);
    setSaving(false);
    if (error) {
      setMsg({
        type: "error",
        text: error.code === "23505" ? "That's already taken. Try another." : error.message || "Update failed",
      });
      return false;
    }
    await refreshUser();
    toast(successText);
    closeModal();
    return true;
  };

  // ── Handlers ──
  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleUpdateUsername = async () => {
    const next = newUsername.trim().toLowerCase();
    if (!USERNAME_RE.test(next)) {
      setMsg({
        type: "error",
        text: "Use 3–30 characters: lowercase letters, numbers or underscores.",
      });
      return;
    }
    if (next === profile.username) return closeModal();
    const ok = await updateUser({ username: next }, "Username updated");
    if (ok) router.replace(`/profile/${next}?settings=true`);
  };

  const handleUpdatePreferences = () => {
    if (selectedInterests.length < 3) {
      setMsg({ type: "error", text: "Please select at least 3 topics." });
      return;
    }
    updateUser({ interests: selectedInterests }, "Interests saved");
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "Use at least 8 characters." });
      return;
    }
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      setMsg({ type: "error", text: error.message || "Update failed" });
      return;
    }
    toast("Password updated");
    closeModal();
  };

  const handleUpdateAbout = () => {
    const content = sanitizeHtml(editorRef.current?.innerHTML || "");
    updateUser({ about_rich: content }, "About updated");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Please choose an image file", "error");
    if (file.size > 3 * 1024 * 1024) return toast("Image must be under 3 MB", "error");

    setAvatarUploading(true);
    try {
      const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;
      await refreshUser();
      toast("Profile picture updated");
      closeModal();
    } catch (err) {
      console.error("Avatar upload failed", err);
      toast("Failed to upload avatar", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleShareProfile = async () => {
    const result = await shareLink({
      title: `${profile.name || profile.username} on Vichento`,
      url: `${window.location.origin}/profile/${profile.username}`,
    });
    if (result === "copied") toast("Profile link copied");
  };

  /* ─────────── Loading / not found ─────────── */

  if (loading || profileLoading)
    return (
      <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full shimmer" />
          <div className="h-4 w-32 rounded shimmer" />
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-white p-4 text-center">
        <div>
          <h1 className="font-creato text-2xl font-bold text-black">Profile not found</h1>
          <p className="mt-2 text-gray-500">This writer doesn&apos;t exist, or changed their username.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-black px-6 py-2.5 text-sm text-white">
            Back to home
          </Link>
        </div>
      </div>
    );

  const displayNameOrHandle = profile.name || profile.username;
  const latestArticle = articles[0] || null;
  const remainingArticles = articles.slice(1);
  const socialEntries = Object.entries(savedSocials).filter(([, v]) => v);

  const profileActions = (className = "") => (
    <div className={`flex gap-2 ${className}`}>
      {isOwnProfile && (
        <Link
          href={`/profile/${profile.username}?settings=true`}
          className="flex-1 rounded-full border border-black py-2 text-center text-sm font-medium transition-colors hover:bg-black hover:text-white"
        >
          Edit profile
        </Link>
      )}
      <button
        onClick={handleShareProfile}
        className={`flex items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm transition-colors hover:border-black ${
          isOwnProfile ? "" : "flex-1"
        }`}
        aria-label="Share profile"
      >
        <RxShare2 size={15} />
        {!isOwnProfile && "Share profile"}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white">
      {user && <Sidebar />}

      {isSettingsView ? (
        /* ── Settings View ── */
        <div className="w-full flex-1 bg-white pb-20">
          <div className="mx-auto w-full max-w-3xl px-4 pt-12 font-creato md:px-6 md:pt-16">
            <div className="mb-10">
              <Link
                href={`/profile/${profile.username}`}
                className="group mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-black"
              >
                <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to profile
              </Link>
              <h1 className="text-4xl font-bold tracking-tight text-black">Settings</h1>
            </div>

            <div className="space-y-10">
              <section className="divide-y divide-gray-100">
                <button
                  onClick={() => openModal("avatar")}
                  className="group flex w-full items-center justify-between py-6 text-left"
                >
                  <div className="space-y-1">
                    <h2 className="text-[15px] font-medium text-black">Profile picture</h2>
                    <p className="font-sans text-sm text-gray-500">Appears on your profile and stories.</p>
                  </div>
                  <span className="relative shrink-0">
                    <Avatar src={profile.avatar} name={displayNameOrHandle} size={72} />
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <PencilIcon className="h-5 w-5 text-white" />
                    </span>
                  </span>
                </button>
                <SettingRow title="Name" value={profile.name || "—"} onClick={() => openModal("name")} />
                <SettingRow title="Username" value={`@${profile.username}`} onClick={() => openModal("username")} />
                <SettingRow title="Short bio" value={profile.bio || "Add a short bio"} onClick={() => openModal("bio")} />
                <SettingRow title="About page" value="The long-form story of you, shown on your About tab." onClick={() => openModal("about")} />
                <SettingRow title="Social links" onClick={() => openModal("socials")}>
                  <div className="flex flex-wrap gap-3 font-sans text-xs text-gray-400">
                    {socialEntries.length
                      ? socialEntries.map(([p]) => <span key={p}>{SOCIALS[p].label}</span>)
                      : "Add your links"}
                  </div>
                </SettingRow>
              </section>

              <section className="divide-y divide-gray-100 pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Account
                </h3>
                <SettingRow
                  title="Interests"
                  value={
                    Array.isArray(profile.interests) && profile.interests.length
                      ? profile.interests.join(", ")
                      : "Personalise your For you feed"
                  }
                  onClick={() => openModal("interests")}
                />
                <SettingRow title="Password" value="Change your password" onClick={() => openModal("password")} />
                <div className="py-6">
                  <h2 className="text-[15px] font-medium text-black">Email</h2>
                  <p className="mt-1 font-sans text-sm text-gray-500">{profile.email || user?.email}</p>
                </div>
              </section>

              <section className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center justify-between py-6"
                >
                  <div className="text-left">
                    <h2 className="text-[15px] font-medium text-red-600">Sign out</h2>
                    <p className="font-sans text-sm text-gray-500">Sign out of this device</p>
                  </div>
                  <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-red-400" />
                </button>
              </section>
            </div>
          </div>
        </div>
      ) : (
        /* ── Profile View ── */
        <div className="w-full min-w-0 flex-1 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
            <div className="flex flex-col gap-12 md:flex-row">
              <div className="min-w-0 max-w-2xl flex-1">
                {/* Mobile Header */}
                <div className="mb-8 md:hidden">
                  <div className="flex items-center gap-4">
                    <Avatar src={profile.avatar} name={displayNameOrHandle} size={64} />
                    <div className="min-w-0">
                      <h1 className="truncate font-creato text-2xl font-bold text-black">
                        {displayNameOrHandle}
                      </h1>
                      <p className="text-sm text-gray-500">
                        @{profile.username} · {articles.length} {articles.length === 1 ? "story" : "stories"}
                      </p>
                    </div>
                  </div>
                  {profile.bio && <p className="mt-4 text-sm leading-relaxed text-gray-600">{profile.bio}</p>}
                  {profileActions("mt-5")}
                </div>

                <h1 className="mb-8 hidden font-creato text-[42px] font-bold tracking-tight text-black md:block">
                  {displayNameOrHandle}
                </h1>

                <div className="hide-scrollbar mb-2 flex gap-8 overflow-x-auto border-b border-gray-100">
                  {["Home", "About"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`relative pb-4 text-sm font-medium transition-colors ${
                        activeTab === t ? "text-black" : "text-gray-500 hover:text-black"
                      }`}
                    >
                      {t}
                      {activeTab === t && <span className="absolute bottom-0 left-0 right-0 h-px bg-black" />}
                    </button>
                  ))}
                </div>

                {activeTab === "Home" ? (
                  articlesLoading ? (
                    <div className="space-y-4 py-8">
                      <div className="aspect-[16/9] w-full rounded-xl shimmer" />
                      <div className="h-6 w-3/4 rounded shimmer" />
                      <div className="h-4 w-1/2 rounded shimmer" />
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="font-creato text-lg font-bold text-black">No stories yet.</p>
                      <p className="mt-2 text-sm text-gray-500">
                        {isOwnProfile
                          ? "Your published stories will show up here."
                          : `${displayNameOrHandle} hasn't published anything yet.`}
                      </p>
                      {isOwnProfile && (
                        <Link
                          href="/write"
                          className="mt-6 inline-block rounded-full bg-black px-5 py-2 text-sm text-white hover:bg-gray-800"
                        >
                          Write your first story
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      {latestArticle && (
                        <div className="border-b border-gray-100 py-8">
                          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">
                            Latest story
                          </p>
                          <Link href={`/read/${latestArticle.slug}`} className="group block">
                            {latestArticle.cover_image && (
                              <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100">
                                <Image
                                  src={getImageUrl(latestArticle.cover_image)}
                                  alt=""
                                  fill
                                  sizes="(min-width: 768px) 672px, 100vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                              </div>
                            )}
                            <h2 className="mb-2 font-creato text-2xl font-bold leading-snug text-black group-hover:text-gray-700">
                              {latestArticle.title}
                            </h2>
                            <p className="mb-4 line-clamp-3 text-[15px] leading-relaxed text-gray-600">
                              {getExcerpt(latestArticle, 220)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(latestArticle.published_at || latestArticle.created_at)} ·{" "}
                              {readingTime(latestArticle.content)} min read
                            </p>
                          </Link>
                        </div>
                      )}
                      {remainingArticles.map((a) => (
                        <Link
                          key={a.id}
                          href={`/read/${a.slug}`}
                          className="group flex items-start gap-6 border-b border-gray-100 py-8"
                        >
                          <div className="min-w-0 flex-1">
                            <h2 className="mb-2 font-creato text-xl font-bold leading-tight text-black group-hover:text-gray-700">
                              {a.title}
                            </h2>
                            <p className="mb-3 line-clamp-2 text-sm text-gray-600">{getExcerpt(a, 160)}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(a.published_at || a.created_at)} · {readingTime(a.content)} min read
                            </p>
                          </div>
                          {a.cover_image && (
                            <div className="relative h-[72px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-[100px] sm:w-[150px]">
                              <Image
                                src={getImageUrl(a.cover_image)}
                                alt=""
                                fill
                                sizes="150px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                          )}
                        </Link>
                      ))}
                    </>
                  )
                ) : (
                  <div className="py-8">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="font-creato text-xl font-bold text-black">
                        About {displayNameOrHandle}
                      </h3>
                      {isOwnProfile && (
                        <button
                          onClick={() => openModal("about")}
                          className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-black hover:text-black"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                    </div>
                    {profile.about_rich ? (
                      <div
                        className="prose mb-12 max-w-none text-[16px] leading-relaxed text-gray-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(profile.about_rich) }}
                      />
                    ) : (
                      <p className="mb-12 text-[16px] leading-relaxed text-gray-600">
                        {profile.bio || "No about information yet."}
                      </p>
                    )}

                    {socialEntries.length > 0 && (
                      <div className="border-t border-gray-100 pt-8">
                        <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">
                          Connect
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {socialEntries.map(([p, v]) => {
                            const Icon = SOCIALS[p].icon;
                            return (
                              <a
                                key={p}
                                href={socialHref(p, v)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-black hover:text-black"
                              >
                                <Icon size={14} />
                                {SOCIALS[p].label}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop sidebar */}
              <aside className="hidden w-72 shrink-0 border-l border-gray-100 pl-10 md:block">
                <div className="sticky top-24">
                  <Avatar src={profile.avatar} name={displayNameOrHandle} size={88} className="mb-5" />
                  <h2 className="font-creato text-lg font-bold text-black">{displayNameOrHandle}</h2>
                  <p className="mb-1 text-sm text-gray-500">@{profile.username}</p>
                  <p className="mb-4 text-sm text-gray-500">
                    {articles.length} {articles.length === 1 ? "story" : "stories"}
                  </p>
                  {profile.bio && (
                    <p className="mb-6 line-clamp-5 text-sm leading-relaxed text-gray-600">{profile.bio}</p>
                  )}
                  {profileActions("mb-8")}
                  {socialEntries.length > 0 && (
                    <div className="flex gap-4 text-gray-500">
                      {socialEntries.map(([p, v]) => {
                        const Icon = SOCIALS[p].icon;
                        return (
                          <a
                            key={p}
                            href={socialHref(p, v)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={SOCIALS[p].label}
                            className="hover:text-black"
                          >
                            <Icon size={17} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <Modal open={modal === "name"} onOpenChange={(o) => !o && closeModal()} title="Display name">
        <h2 className="mb-2 font-creato text-xl font-bold text-black">Name</h2>
        <p className="mb-5 text-sm text-gray-500">Appears on your profile page, as your byline, and in your responses.</p>
        <input
          type="text"
          maxLength={50}
          className={fieldClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
        />
        <p className="mt-1.5 text-right text-xs text-gray-400">{displayName.length}/50</p>
        <Message msg={msg} />
        <ModalActions
          onCancel={closeModal}
          loading={saving}
          disabled={!displayName.trim()}
          onSave={() => updateUser({ name: displayName.trim() }, "Name updated")}
        />
      </Modal>

      <Modal open={modal === "username"} onOpenChange={(o) => !o && closeModal()} title="Username">
        <h2 className="mb-2 font-creato text-xl font-bold text-black">Username</h2>
        <p className="mb-5 text-sm text-gray-500">This is your profile URL: vichento.com/profile/{newUsername || "…"}</p>
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-3.5 transition-colors focus-within:border-black focus-within:bg-white">
          <span className="text-gray-400">@</span>
          <input
            type="text"
            maxLength={30}
            className="w-full bg-transparent text-black outline-none"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
            autoFocus
          />
        </div>
        <Message msg={msg} />
        <ModalActions onCancel={closeModal} loading={saving} onSave={handleUpdateUsername} />
      </Modal>

      <Modal open={modal === "bio"} onOpenChange={(o) => !o && closeModal()} title="Short bio">
        <div className="mb-5 flex items-center justify-between pr-8">
          <h2 className="font-creato text-xl font-bold text-black">Short bio</h2>
          <span className={`text-xs ${bioText.length > 160 ? "text-red-500" : "text-gray-400"}`}>
            {bioText.length}/160
          </span>
        </div>
        <textarea
          className={`${fieldClass} h-32 resize-none ${bioText.length > 160 ? "border-red-400" : ""}`}
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          placeholder="Writer, reader, curious about everything…"
          autoFocus
        />
        <Message msg={msg} />
        <ModalActions
          onCancel={closeModal}
          loading={saving}
          disabled={bioText.length > 160}
          onSave={() => updateUser({ bio: bioText.trim() }, "Bio updated")}
        />
      </Modal>

      <Modal open={modal === "socials"} onOpenChange={(o) => !o && closeModal()} title="Social links">
        <h2 className="mb-5 font-creato text-xl font-bold text-black">Social links</h2>
        <div className="space-y-4">
          {Object.entries(SOCIALS).map(([key, { label, icon: Icon, placeholder }]) => (
            <label key={key} className="block">
              <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-gray-500">
                <Icon size={13} /> {label}
              </span>
              <input
                type="text"
                className={fieldClass}
                placeholder={placeholder}
                value={socials[key]}
                onChange={(e) => setSocials({ ...socials, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <Message msg={msg} />
        <ModalActions
          onCancel={closeModal}
          loading={saving}
          onSave={() =>
            updateUser(
              Object.fromEntries(Object.entries(socials).map(([k, v]) => [k, v.trim()])),
              "Links updated",
            )
          }
        />
      </Modal>

      <Modal open={modal === "interests"} onOpenChange={(o) => !o && closeModal()} title="Interests">
        <h2 className="mb-2 font-creato text-xl font-bold text-black">Interests</h2>
        <p className="mb-5 text-sm text-gray-500">Pick 3 or more topics to shape your For you feed.</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((t) => {
            const on = selectedInterests.includes(t);
            return (
              <button
                key={t}
                aria-pressed={on}
                onClick={() =>
                  setSelectedInterests(on ? selectedInterests.filter((i) => i !== t) : [...selectedInterests, t])
                }
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  on ? "border-black bg-black text-white" : "border-gray-300 hover:border-black"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <Message msg={msg} />
        <ModalActions onCancel={closeModal} loading={saving} onSave={handleUpdatePreferences} />
      </Modal>

      <Modal open={modal === "password"} onOpenChange={(o) => !o && closeModal()} title="Change password">
        <h2 className="mb-5 font-creato text-xl font-bold text-black">Change password</h2>
        <input
          type="password"
          autoComplete="new-password"
          placeholder="New password (8+ characters)"
          className={fieldClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoFocus
        />
        <Message msg={msg} />
        <ModalActions onCancel={closeModal} loading={saving} onSave={handleUpdatePassword} saveLabel="Update" />
      </Modal>

      <Modal open={modal === "avatar"} onOpenChange={(o) => !o && closeModal()} title="Profile picture" size="sm">
        <div className="flex flex-col items-center text-center">
          <h2 className="mb-6 font-creato text-xl font-bold text-black">Profile picture</h2>
          <Avatar src={profile.avatar} name={displayNameOrHandle} size={120} className="mb-6 border border-gray-100" />
          <p className="mb-6 text-xs text-gray-500">Square images work best. JPG, PNG or WebP, up to 3 MB.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="w-full rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {avatarUploading ? "Uploading…" : "Upload new photo"}
          </button>
          <button onClick={closeModal} className="mt-2 w-full py-3 text-sm text-gray-500 hover:text-black">
            Cancel
          </button>
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleAvatarChange} />
        </div>
      </Modal>

      {/* ── About Rich Text Editor Modal ── */}
      <Modal open={modal === "about"} onOpenChange={(o) => !o && closeModal()} size="large" title="Edit about">
        <div className="flex h-[70vh] flex-col text-black">
          <h2 className="mb-5 font-creato text-2xl font-bold">Edit about</h2>
          <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1.5">
            {[
              { cmd: "bold", icon: "B", label: "Bold", cls: "font-bold" },
              { cmd: "italic", icon: "I", label: "Italic", cls: "italic" },
              { cmd: "underline", icon: "U", label: "Underline", cls: "underline" },
              { cmd: "insertUnorderedList", icon: "•", label: "Bullet list" },
              { cmd: "insertOrderedList", icon: "1.", label: "Numbered list" },
              { cmd: "formatBlock", val: "h2", icon: "H1", label: "Heading" },
              { cmd: "formatBlock", val: "h3", icon: "H2", label: "Subheading" },
              { cmd: "formatBlock", val: "blockquote", icon: "“", label: "Quote" },
              { cmd: "formatBlock", val: "p", icon: "¶", label: "Paragraph" },
            ].map((btn) => (
              <button
                key={btn.label}
                title={btn.label}
                aria-label={btn.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand(btn.cmd, false, btn.val || null);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-[15px] transition-colors hover:bg-gray-200 ${btn.cls || "font-semibold"}`}
              >
                {btn.icon}
              </button>
            ))}
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Tell readers who you are, what you write about, and why…"
            className="prose max-w-none flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 outline-none transition-colors focus:border-black"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(profile.about_rich || "") }}
          />
          <Message msg={msg} />
          <ModalActions onCancel={closeModal} loading={saving} onSave={handleUpdateAbout} saveLabel="Save changes" />
        </div>
      </Modal>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProfilePage />
    </Suspense>
  );
}
