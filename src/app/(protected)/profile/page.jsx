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


  // const AVATARS = [
  //   "69c3b1190013e1c34def",
  //   "69c3b11400366576f43f",
  //   "69c3b1100001e28a6f53",
  //   "69c3b10b0017652ee857",
  //   "69c3b105001867b3414e",
  //   "69c3b0ff00156e6886a7",
  //   "69c3b0f60016e5e370cd",
  //   "69c3b0f00026e0b5d9e5",
  //   "69c3b0e3002d6b4bc943",
  //   "69c3b0de0017064e0a1e",
  //   "69c3b0ce003aecbf2faa",
  //   "69c3b0b90038fc4c6a8d",
  // ];

  // console.log(user); // Get details of Auth User

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
    <div className="w-full">
      <div className="w-full max-w-[800px] px-4 md:px-0 pt-10 mx-auto ">
        <div className="flex justify-between items-baseline">
          <h1 className="text-[24px] text-black tracking-tight font-creato">Profile</h1>
          <div className="relative">
            <img
              src={profile?.avatar || "/default-avatar.jpg"}
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />

            {/* ✏️ Pen Icon */}
            <div className="absolute bottom-0 right-0 bg-black p-1 rounded-full">
              <PencilIcon className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <hr className="mb-4 text-black mt-2 opacity-20" />
        <div className="w-full flex flex-col mt-10 gap-6">
          <div className="flex items-center text-[14px] justify-between text-black/60">
            <p>Display Name</p>
            <button
              onClick={() => setDisplayNameModal(true)}
              className="underline cursor-pointer "
            >
              {profile?.name || "—"}
            </button>
          </div>

          <div className="flex items-center text-[14px] justify-between text-black/60">
            <p>User Name</p>
            <button
              onClick={() => setUsernameModalOpen(true)}
              className="underline cursor-pointer"
            >
              <ArrowUpRightIcon className="w-4 h-4 inline" />
            </button>
          </div>

          <div className="flex items-center text-[14px] justify-between text-black/60">
            <p>Email Address</p>
            <p>{profile?.email || "—"}</p>
          </div>

          <div
            onClick={() => setChangePasswordOpen(true)}
            className="flex cursor-pointer items-center text-[14px] justify-between text-black/60"
          >
            <p>Change Password</p>
            <p className="cursor-pointer underline">
              <ArrowUpRightIcon className="w-4 h-4 inline" />
            </p>
          </div>
          <div
            onClick={() => setPreferencesOpen(true)}
            className="flex cursor-pointer items-center text-[14px] justify-between text-black/60"
          >
            <p>Preferences</p>
            <p className="cursor-pointer underline">
              <ArrowUpRightIcon className="w-4 h-4 inline" />
            </p>
          </div>
          <div className="flex items-center text-[14px]  justify-between text-black/60">
            <p>About</p>
            <button onClick={() => setBioModalOpen(true)} className=" cursor-pointer">
              <ArrowUpRightIcon className="w-4 h-4 inline" />
            </button>
          </div>
          <hr className="md:my-10 my-6 opacity-20" />
          <button
            onClick={logout}
            className="w-full cursor-pointer text-left flex items-center justify-between bg-white border border-gray-200 md:py-5 py-2 px-4 rounded-lg "
          >
            <div>
              <p className="text-red-500 md:text-[14px] text-sm">Logout</p>
              <p className="md:text-[12px] text-xs text-black/50">
                Permanently delete your account and all of your content.
              </p>
            </div>
            <ArrowRightStartOnRectangleIcon className="w-6 h-6 ml-1 inline text-red-500" />
          </button>
        </div>
        <div className="mt-8 w-full">
          <h1 className="md:text-[16px] text-sm text-center  text-black/40">
            Made with <span className="text-red-600">&#10084;</span>  <span >in India</span>
          </h1>
        </div>
      </div>

      {/* ---------- Display Name Modal ---------- */}
      <Modal open={displayNameModal} onOpenChange={setDisplayNameModal}>
        <h2 className="text-[16px] font-creato text-black mb-4">Display Name</h2>

        <input
          placeholder="New Display Name"
          className="outline-none px-2 font-creato w-full border-b border-gray-300 text-black text-[14px] py-1 "
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        {displayMsg && (
          <p
            className={`mt-2 text-sm ${displayMsg.type === "error" ? "text-red-500" : "text-green-600"
              }`}
          >
            {displayMsg.text}
          </p>
        )}

        <div className="flex gap-4 mt-4 justify-end">
          <button
            onClick={() => setDisplayNameModal(false)}
            className="px-4 border border-gray-400 py-1 text-black rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateDisplayName}
            disabled={displayLoading}
            className="px-4 py-1 bg-black text-white rounded-full"
          >
            {displayLoading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </Modal>

      {/* ---------- Username Modal ---------- */}
      <Modal open={usernameModalOpen} onOpenChange={setUsernameModalOpen}>
        <h2 className="text-[16px] text-black font-creato mb-4">Change Username</h2>

        <input
          type="text"
          placeholder="@newusername"
          className="border-b border-gray-300 outline-none p-2 w-full font-creato text-black text-[14px]"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />

        {usernameMsg && (
          <p
            className={`mt-2 text-sm ${usernameMsg.type === "error" ? "text-red-500" : "text-green-600"
              }`}
          >
            {usernameMsg.text}
          </p>
        )}

        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => setUsernameModalOpen(false)}
            className="px-4 border border-gray-400 py-1 text-black rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateUsername}
            disabled={usernameLoading}
            className="px-4 py-1 bg-black text-white rounded-full"
          >
            {usernameLoading ? "Saving..." : "Update"}
          </button>
        </div>
      </Modal>

      {/* ---------- Bio Modal ---------- */}
      <Modal open={bioModalOpen} onOpenChange={setBioModalOpen}>
        <h2 className="text-[16px] text-black font-creato mb-4">Update Bio</h2>

        <textarea
          placeholder="Write your bio..."
          className="outline-none p-2 text-[14px] w-full text-black rounded-md bg-gray-200"
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          rows={6}
        />

        {bioMsg && (
          <p
            className={`mt-2 text-sm ${bioMsg.type === "error" ? "text-red-500" : "text-green-600"
              }`}
          >
            {bioMsg.text}
          </p>
        )}

        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => setBioModalOpen(false)}
            className="px-4 border border-gray-400 py-1 text-black rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateBio}
            disabled={bioLoading}
            className="px-4 py-1 bg-black text-white rounded-full"
          >
            {bioLoading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </Modal>

      {/* ---------- Preferences Modal ---------- */}
      <Modal open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <h2 className="text-[16px] text-black mb-2 font-creato">Update Preferences</h2>

        <p className="text-sm text-gray-500 mb-4">
          Choose at least 3 topics you’re interested in
        </p>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest);
            return (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-1.5 rounded-full text-sm border transition ${isSelected
                  ? "bg-black text-white border-black"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
              >
                {interest}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <p className="text-xs text-gray-500 mb-2">
          {selectedInterests.length} / 5 selected
        </p>

        {/* Message */}
        {prefMsg && (
          <p
            className={`mt-2 text-sm ${prefMsg.type === "error" ? "text-red-500" : "text-green-600"
              }`}
          >
            {prefMsg.text}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-5 justify-end">
          <button
            onClick={() => setPreferencesOpen(false)}
            className="px-4 py-1 rounded-full border border-gray-400 text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdatePreferences}
            disabled={prefLoading}
            className="px-4 py-1 bg-black text-white rounded-full text-sm disabled:opacity-60 "
          >
            {prefLoading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </Modal>

      {/* ---------- Change Password Modal ---------- */}
      <Modal open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <h2 className="text-[16px] text-black font-creato mb-4">Change Password</h2>

        <input
          placeholder="Current Password"
          className="outline-none px-2 w-full border-b border-gray-300 text-black text-[14px] py-1 mb-4"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <input
          placeholder="New Password"
          className="outline-none px-2 w-full border-b border-gray-300 text-black text-[14px] py-1 mb-4"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {passMsg && (
          <p
            className={`mt-2 text-sm ${passMsg.type === "error" ? "text-red-500" : "text-green-600"
              }`}
          >
            {passMsg.text}
          </p>
        )}

        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => setChangePasswordOpen(false)}
            className="px-4 py-1 rounded-full border border-gray-400 text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleChangePassword}
            disabled={passLoading}
            className="px-4 py-1 bg-black text-white rounded-full"
          >
            {passLoading ? "Saving..." : "Change"}
          </button>
        </div>
      </Modal>

      {/* ---------- Delete Account modal (keeps as demo; implement server-side deletion carefully) ---------- */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <h2 className="text-[16px] mb-4">Delete Account</h2>
        <p className="text-[14px] text-black/60">
          This will permanently delete your account and all associated content.
        </p>
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="px-4 py-1 rounded"
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 bg-red-700 text-white rounded"
            onClick={() => {
              // implement deletion carefully — server-side is recommended.
              alert("Implement account deletion on server or using Admin SDK.");
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
      <Modal open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <h2 className="text-[16px] mb-4">Choose Avatar</h2>

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

        {/* OR Divider */}
        <div className="text-center text-xs text-gray-400 mb-2">OR</div>

        {/* Upload Option */}
        <button
          onClick={() => {
            if (!avatarUploading) fileInputRef.current.click();
          }}
          disabled={avatarUploading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
        >
          {avatarUploading ? "Uploading..." : "Select from Gallery"}
        </button>

        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleAvatarChange}
        />
      </Modal>
    </div>
  );
};

export default Page;
