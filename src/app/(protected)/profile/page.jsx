"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { ArrowRightStartOnRectangleIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import Modal from "@/app/components/ui/Modal";
import { useRouter } from "next/navigation";
import { PencilIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { logout } from "../../../../services/authService";

const Page = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const { user, loading, setUser } = useAuthContext();
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const INTERESTS = [
    "Technology",
    "AI",
    "Startups",
    "Business",
    "Programming",
    "Design",
    "Productivity",
    "Finance",
    "Marketing",
    "Health",
    "Career",
    "Sports",
    "Science",
    "Writing",
  ];

  // State for preferences



  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData?.user) return;

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      setProfile(data);
    };

    fetchProfile();
  }, []);

  const [selectedInterests, setSelectedInterests] = useState(
    user?.prefs?.interests || []
  );
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefMsg, setPrefMsg] = useState(null);

  // Toggle chip selection logic
  const toggleInterest = (interest) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length >= 5) return prev; // max 5 interests
      return [...prev, interest];
    });
  };
  // Save preferences to Appwrite 
  const handleUpdatePreferences = async () => {
    if (selectedInterests.length < 3) {
      setPrefMsg({
        type: "error",
        text: "Please select at least 3 interests",
      });
      return;
    }

    try {
      setPrefLoading(true);
      setPrefMsg(null);

      await account.updatePrefs({
        ...user.prefs,
        interests: selectedInterests,
      });

      setPrefMsg({
        type: "success",
        text: "Preferences updated successfully",
      });
    } catch (err) {
      setPrefMsg({
        type: "error",
        text: err.message || "Failed to update preferences",
      });
    } finally {
      setPrefLoading(false);
      setPreferencesOpen(false);
    }
  };

  // collapsible bio (kept if you still need it)
  const [BioExpand, setBioExpand] = useState(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState("0px");

  // modal states
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [displayNameModal, setDisplayNameModal] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // form states
  const [newUsername, setNewUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [displayLoading, setDisplayLoading] = useState(false);
  const [displayMsg, setDisplayMsg] = useState(null);

  const [bioText, setBioText] = useState("");
  const [bioLoading, setBioLoading] = useState(false);
  const [bioMsg, setBioMsg] = useState(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);



  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    router.refresh();
  };
  const handleSelectAvatar = async (avatarId) => {
    try {
      setAvatarUploading(true);

      await account.updatePrefs({
        ...(user.prefs || {}),
        avatar: avatarId,
      });

      await refreshUser();
      setAvatarModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  // fill inputs when modal opens from existing user
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setBioText((user.prefs && user.prefs.bio) || "");
      setNewUsername((user.prefs && user.prefs.username) || "");
    }
  }, [user]);

  // animate expand/collapse by auto-calculating content height
  useEffect(() => {
    if (BioExpand) {
      setHeight(contentRef.current?.scrollHeight + "px" || "0px");
    } else {
      setHeight("0px");
    }
  }, [BioExpand]);

  // UTILS: refresh user from Appwrite and update AuthContext
  async function refreshUser() {
    try {
      const updated = await account.get();
      setUser(updated);
    } catch (err) {
      console.error("refreshUser error", err);
    }
  }

  // ------------------ Handlers ------------------

  // Update Display Name
  const handleUpdateDisplayName = async () => {
    setDisplayLoading(true);
    setDisplayMsg(null);

    try {
      await account.updateName(displayName); // Appwrite method for name
      await refreshUser();
      setDisplayMsg({ type: "success", text: "Display name updated." });
      setTimeout(() => {
        setDisplayNameModal(false);
        setDisplayMsg(null);
      }, 900);
    } catch (err) {
      console.error(err);
      setDisplayMsg({ type: "error", text: err.message || "Update failed" });
    } finally {
      setDisplayLoading(false);
    }
  };

  // Update Username (stored in prefs)
  const handleUpdateUsername = async () => {
    setUsernameLoading(true);
    setUsernameMsg(null);

    try {
      // Update prefs (merge new object)
      await account.updatePrefs({
        ...(user.prefs || {}),
        username: newUsername,
      });
      await refreshUser();
      setUsernameMsg({ type: "success", text: "Username updated." });
      setTimeout(() => {
        setUsernameModalOpen(false);
        setUsernameMsg(null);
      }, 900);
    } catch (err) {
      console.error(err);
      setUsernameMsg({ type: "error", text: err.message || "Update failed" });
    } finally {
      setUsernameLoading(false);
    }
  };

  // Update Bio
  const handleUpdateBio = async () => {
    setBioLoading(true);
    setBioMsg(null);

    try {
      await account.updatePrefs({ ...(user.prefs || {}), bio: bioText });
      await refreshUser();
      setBioMsg({ type: "success", text: "Bio updated." });
      setTimeout(() => {
        setBioModalOpen(false);
        setBioMsg(null);
      }, 900);
    } catch (err) {
      console.error(err);
      setBioMsg({ type: "error", text: err.message || "Update failed" });
    } finally {
      setBioLoading(false);
    }
  };

  // Update Password (tries common SDK signatures)
  const handleChangePassword = async () => {
    setPassLoading(true);
    setPassMsg(null);

    try {
      let done = false;
      // Try positional signature: updatePassword(newPassword, oldPassword)
      try {
        // some SDKs expect (password, oldPassword)
        // call and await
        // eslint-disable-next-line no-underscore-dangle
        await account.updatePassword(newPassword, oldPassword);
        done = true;
      } catch (err1) {
        console.warn("positional updatePassword failed", err1?.message || err1);
      }

      if (!done) {
        // Try object signature: updatePassword({ password, oldPassword })
        try {
          await account.updatePassword({ password: newPassword, oldPassword });
          done = true;
        } catch (err2) {
          console.warn("object updatePassword failed", err2?.message || err2);
        }
      }

      if (!done) {
        // Try alternate object key names if SDK expects them
        try {
          await account.updatePassword({ newPassword, oldPassword });
          done = true;
        } catch (err3) {
          console.warn(
            "alternate updatePassword failed",
            err3?.message || err3
          );
        }
      }

      if (!done)
        throw new Error(
          "Unable to update password with current SDK. Check SDK docs/version."
        );

      // success
      setPassMsg({ type: "success", text: "Password updated." });
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPassMsg(null);
      }, 900);
    } catch (err) {
      console.error(err);
      setPassMsg({
        type: "error",
        text:
          err.message ||
          "Failed to update password. Ensure old password is correct and new password meets policy.",
      });
    } finally {
      setPassLoading(false);
    }
  };

  //Handle Avatar Change

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // optional validation
    if (file.size > 2 * 1024 * 1024) {
      alert("Max image size is 2MB");
      return;
    }

    try {
      setAvatarUploading(true);

      // delete old avatar if exists
      if (user?.prefs?.avatar) {
        await storage.deleteFile("article-images", user.prefs.avatar);
      }

      // upload new avatar
      const uploaded = await storage.createFile(
        "article-images",
        ID.unique(),
        file
      );

      // save fileId in prefs
      await account.updatePrefs({
        ...(user.prefs || {}),
        avatar: uploaded.$id,
      });

      await refreshUser();
    } catch (err) {
      console.error("Avatar upload failed", err);
      alert("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  //Avatar Url Helper

  const getAvatarUrl = () => {
    if (!user?.prefs?.avatar) return "/default-avatar.png";

    return storage.getFileView("article-images", user.prefs.avatar);
  };

  // ------------------ UI ------------------

  if (!user) return null; // or show loading/redirect as you prefer

  return (
    <div className="w-full bg-white min-h-screen pb-20">
      <div className="w-full max-w-3xl px-4 md:px-6 pt-16 mx-auto font-creato">
        <h1 className="text-4xl font-semibold tracking-tight text-black mb-12">Settings</h1>

        <div className="space-y-10">
          {/* Profile Information Section */}
          <section>
            <div className="flex items-center justify-between py-6 border-b border-gray-200">
              <div className="space-y-1">
                <h2 className="text-[15px] font-medium text-black">Profile picture</h2>
                <p className="text-sm text-gray-500">Your profile picture will appear on your profile page.</p>
              </div>
              <div className="relative cursor-pointer group ml-4 shrink-0" onClick={() => setAvatarModalOpen(true)}>
                <img
                  src={profile?.avatar || "/default-avatar.jpg"}
                  alt="Profile"
                  className="w-[88px] h-[88px] rounded-full object-cover group-hover:opacity-80 transition-opacity bg-gray-100"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PencilIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-6 border-b border-gray-200 cursor-pointer group" onClick={() => setDisplayNameModal(true)}>
              <div className="space-y-1 flex-1 pr-4">
                <h2 className="text-[15px] font-medium text-black">Name</h2>
                <p className="text-sm text-gray-500 line-clamp-1">{profile?.name || "—"}</p>
              </div>
              <p className="text-sm text-gray-400 group-hover:text-black transition-colors">Edit</p>
            </div>

            <div className="flex items-center justify-between py-6 border-b border-gray-200 cursor-pointer group" onClick={() => setUsernameModalOpen(true)}>
              <div className="space-y-1 flex-1 pr-4">
                <h2 className="text-[15px] font-medium text-black">Username</h2>
                <p className="text-sm text-gray-500 line-clamp-1">{profile?.username || "Add a username"}</p>
              </div>
              <p className="text-sm text-gray-400 group-hover:text-black transition-colors">Edit</p>
            </div>

            <div className="flex items-center justify-between py-6 border-b border-gray-200 cursor-pointer group" onClick={() => setBioModalOpen(true)}>
              <div className="space-y-1 flex-1 pr-4">
                <h2 className="text-[15px] font-medium text-black">Short bio</h2>
                <p className="text-sm text-gray-500 line-clamp-2">{profile?.bio || "Add a short bio"}</p>
              </div>
              <p className="text-sm text-gray-400 group-hover:text-black transition-colors">Edit</p>
            </div>

            <div className="flex items-center justify-between py-6 border-b border-gray-200">
              <div className="space-y-1 flex-1 pr-4">
                <h2 className="text-[15px] font-medium text-black">Email address</h2>
                <p className="text-sm text-gray-500">{profile?.email || "—"}</p>
              </div>
            </div>
          </section>

          {/* Account Management Section */}
          <section className="pt-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-widest uppercase">Account</h3>

            <div className="flex items-center justify-between py-6 border-b border-gray-200 cursor-pointer group" onClick={() => setChangePasswordOpen(true)}>
              <div className="space-y-1 flex-1 pr-4">
                <h2 className="text-[15px] font-medium text-black">Password</h2>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
              <p className="text-sm text-gray-400 group-hover:text-black transition-colors">Edit</p>
            </div>

            <div className="flex items-center justify-between py-6 border-b border-gray-200 cursor-pointer group" onClick={() => setPreferencesOpen(true)}>
              <div className="space-y-1 flex-1 pr-4">
                <h2 className="text-[15px] font-medium text-black">Topics of Interest</h2>
                <p className="text-sm text-gray-500">Manage your reading preferences</p>
              </div>
              <p className="text-sm text-gray-400 group-hover:text-black transition-colors">Edit</p>
            </div>
          </section>

          <section className="pt-4">
            <h3 className="text-xs font-semibold text-red-500 mb-2 tracking-widest uppercase">Danger Zone</h3>

            <button
              onClick={logout}
              className="w-full text-left flex items-center justify-between py-6 cursor-pointer group"
            >
              <div className="space-y-1">
                <h2 className="text-[15px] font-medium text-red-600">Sign out</h2>
                <p className="text-sm text-gray-500">Sign out of your account on this device</p>
              </div>
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </section>
        </div>

        <div className="mt-16 pt-8 flex justify-center">
          <p className="text-sm text-gray-400 font-serif italic">
            Made with <span className="text-red-500 mx-1 not-italic text-lg leading-none align-middle">&hearts;</span> in India
          </p>
        </div>
      </div>

      {/* ---------- Display Name Modal ---------- */}
      <Modal open={displayNameModal} onOpenChange={setDisplayNameModal}>
        <div className="p-2">
          <h2 className="text-xl font-semibold text-black mb-6">Display Name</h2>

          <input
            placeholder="New Display Name"
            className="outline-none w-full border-b border-gray-200 focus:border-black text-black text-[15px] py-2 transition-colors placeholder:text-gray-400"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
          />

          {displayMsg && (
            <p
              className={`mt-3 text-sm ${displayMsg.type === "error" ? "text-red-500" : "text-green-600"
                }`}
            >
              {displayMsg.text}
            </p>
          )}

          <div className="flex gap-3 mt-8 justify-end">
            <button
              onClick={() => setDisplayNameModal(false)}
              className="px-5 py-2 text-[14px] text-gray-500 hover:text-black font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateDisplayName}
              disabled={displayLoading}
              className="px-5 py-2 text-[14px] bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {displayLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ---------- Username Modal ---------- */}
      <Modal open={usernameModalOpen} onOpenChange={setUsernameModalOpen}>
        <div className="p-2">
          <h2 className="text-xl font-semibold text-black mb-6">Change Username</h2>

          <input
            type="text"
            placeholder="@newusername"
            className="outline-none w-full border-b border-gray-200 focus:border-black text-black text-[15px] py-2 transition-colors placeholder:text-gray-400"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            autoFocus
          />

          {usernameMsg && (
            <p
              className={`mt-3 text-sm ${usernameMsg.type === "error" ? "text-red-500" : "text-green-600"
                }`}
            >
              {usernameMsg.text}
            </p>
          )}

          <div className="flex gap-3 mt-8 justify-end">
            <button
              onClick={() => setUsernameModalOpen(false)}
              className="px-5 py-2 text-[14px] text-gray-500 hover:text-black font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateUsername}
              disabled={usernameLoading}
              className="px-5 py-2 text-[14px] bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {usernameLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ---------- Bio Modal ---------- */}
      <Modal open={bioModalOpen} onOpenChange={setBioModalOpen}>
        <div className="p-2">
          <h2 className="text-xl font-semibold text-black mb-6">Short bio</h2>

          <textarea
            placeholder="Write your bio..."
            className="outline-none p-3 text-[15px] w-full text-black rounded-xl bg-gray-50 border border-gray-200 focus:border-gray-400 focus:bg-white transition-all resize-none"
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            rows={5}
            autoFocus
          />

          {bioMsg && (
            <p
              className={`mt-3 text-sm ${bioMsg.type === "error" ? "text-red-500" : "text-green-600"
                }`}
            >
              {bioMsg.text}
            </p>
          )}

          <div className="flex gap-3 mt-8 justify-end">
            <button
              onClick={() => setBioModalOpen(false)}
              className="px-5 py-2 text-[14px] text-gray-500 hover:text-black font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateBio}
              disabled={bioLoading}
              className="px-5 py-2 text-[14px] bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {bioLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ---------- Preferences Modal ---------- */}
      <Modal open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <div className="p-2">
          <h2 className="text-xl font-semibold text-black mb-2">Topics of Interest</h2>

          <p className="text-[15px] text-gray-500 mb-6">
            Choose at least 3 topics you're interested in reading about.
          </p>

          {/* Chips */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            {INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-[14px] border transition-colors ${isSelected
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          {/* Counter */}
          <p className="text-sm text-gray-400 mb-2">
            {selectedInterests.length} / 5 selected
          </p>

          {/* Message */}
          {prefMsg && (
            <p
              className={`mt-3 text-sm ${prefMsg.type === "error" ? "text-red-500" : "text-green-600"
                }`}
            >
              {prefMsg.text}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8 justify-end">
            <button
              onClick={() => setPreferencesOpen(false)}
              className="px-5 py-2 text-[14px] text-gray-500 hover:text-black font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePreferences}
              disabled={prefLoading}
              className="px-5 py-2 text-[14px] bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {prefLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ---------- Change Password Modal ---------- */}
      <Modal open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <div className="p-2">
          <h2 className="text-xl font-semibold text-black mb-6">Change Password</h2>

          <div className="space-y-6">
            <input
              placeholder="Current Password"
              className="outline-none w-full border-b border-gray-200 focus:border-black text-black text-[15px] py-2 transition-colors placeholder:text-gray-400"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoFocus
            />

            <input
              placeholder="New Password"
              className="outline-none w-full border-b border-gray-200 focus:border-black text-black text-[15px] py-2 transition-colors placeholder:text-gray-400"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {passMsg && (
            <p
              className={`mt-3 text-sm ${passMsg.type === "error" ? "text-red-500" : "text-green-600"
                }`}
            >
              {passMsg.text}
            </p>
          )}

          <div className="flex gap-3 mt-8 justify-end">
            <button
              onClick={() => setChangePasswordOpen(false)}
              className="px-5 py-2 text-[14px] text-gray-500 hover:text-black font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={passLoading}
              className="px-5 py-2 text-[14px] bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {passLoading ? "Saving..." : "Change"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ---------- Delete Account modal (keeps as demo; implement server-side deletion carefully) ---------- */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <div className="p-2">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Delete Account</h2>
          <p className="text-[15px] text-gray-600 mb-8">
            This will permanently delete your account and all associated content. This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-5 py-2 text-[14px] text-gray-500 hover:text-black font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 text-[14px] bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
              onClick={() => {
                // implement deletion carefully — server-side is recommended.
                alert("Implement account deletion on server or using Admin SDK.");
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <div className="p-2 text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Profile picture</h2>
          <p className="text-[15px] text-gray-500 mb-8">Choose an image for your profile.</p>

          {/* Avatar Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {/* {AVATARS.map((id) => (
              <img
                key={id}
                src={storage.getFileView("article-images", id)}
                className={`w-14 h-14 rounded-full cursor-pointer border hover:scale-105 transition ${avatarUploading ? "pointer-events-none opacity-50" : ""
                  }`}
                onClick={() => handleSelectAvatar(id)}
              />
            ))} */}
          </div>

          {/* Upload Option */}
          <button
            onClick={() => {
              if (!avatarUploading) fileInputRef.current.click();
            }}
            disabled={avatarUploading}
            className="w-full bg-black hover:bg-gray-800 transition-colors text-white py-3 rounded-full font-medium disabled:opacity-50"
          >
            {avatarUploading ? "Uploading..." : "Select an image"}
          </button>

          <button
            onClick={() => setAvatarModalOpen(false)}
            className="mt-4 text-[14px] text-gray-500 hover:text-black font-medium transition-colors"
          >
            Cancel
          </button>

          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleAvatarChange}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Page;
