"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// ---------------- AVATARS ----------------
const AVATARS = [
  "1.png",
  "2.png",
  "3.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png",
  "8.png",
  "9.png",
  "10.png",
  "11.png",
  "12.png",
];

const professions = [
  "Student",
  "Freelancer",
  "Working Professional",
  "Teacher",
  "Developer",
  "Designer",
  "Entrepreneur",
  "Content Creator",
  "Engineer",
  "Doctor",
  "Artist",
  "Other",
];

// ---------------- HELPERS ----------------
const getRandomAvatar = () => {
  const file = AVATARS[Math.floor(Math.random() * AVATARS.length)]

  const { data } = supabase.storage
    .from("user_avatars")
    .getPublicUrl(file)

  return data.publicUrl
}

const generateUsername = (name) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${random}`;
};

// ---------------- COMPONENT ----------------
export default function EmailSignup() {
  const router = useRouter();
  const { setUser } = useAuthContext();

  const [step, setStep] = useState(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [profession, setProfession] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ---------------- STEP 1 ----------------
  const handleSignupStep1 = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!passwordRegex.test(pass)) {
      return setErrorMsg(
        "Password must be at least 6 characters and include a letter, number, and special character."
      );
    }

    if (!email) {
      return setErrorMsg("Please enter a valid email.");
    }

    setStep(2);
  };

  // ---------------- STEP 2 ----------------
 const handleSignupStep2 = async () => {
  setLoading(true)
  setErrorMsg("")

  if (!name || !dob || !profession) {
    setLoading(false)
    return setErrorMsg("Please fill all fields.")
  }

  try {
    const username = generateUsername(name)
    const avatar = getRandomAvatar()

    // ✅ Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    })

    if (error) throw error

    const user = data.user

    if (!user) {
      setLoading(false)
      return setErrorMsg("Please verify your email first.")
    }

    // ✅ Insert into users table
    const { error: dbError } = await supabase
      .from("users")
      .insert([
        {
          id: user.id,
          email,
          name,
          username,
          dob,
          profession,
          avatar,
        },
      ])

    if (dbError) throw dbError

    router.push("/")
  } catch (error) {
    setErrorMsg(error.message)
  }

  setLoading(false)
}

  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6">
      
      {/* ---------------- STEP 1 ---------------- */}
      {step === 1 && (
        <>
          <Image width={60} height={60} alt="logo" src={"/logo.png"} />

          <h1 className="text-2xl mt-10 text-black font-creato tracking-tight">
            Create your account
          </h1>

          <p className="text-sm mt-2 text-black/60 text-center mb-10">
            It only takes a moment to get started with your account.
          </p>

          <form
            className="w-full max-w-[300px] flex flex-col"
            onSubmit={handleSignupStep1}
          >
            <label className="text-xs mt-4 text-gray-700">Email</label>

            <input
              type="email"
              placeholder="johndoe@hotmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-b py-1 outline-none"
              required
            />

            <div className="relative mt-4">
              <label className="text-xs text-gray-700">Password</label>

              <input
                type={showPassword ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full border-b py-1 outline-none"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-6"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs mt-3">{errorMsg}</p>
            )}

            <button className="bg-black text-white rounded-full py-2 mt-6">
              Next →
            </button>
          </form>
        </>
      )}

      {/* ---------------- STEP 2 ---------------- */}
      {step === 2 && (
        <div className="w-full max-w-[300px]">
          <h1 className="text-xl text-center">Tell us about you</h1>

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border-b mt-6 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="date"
            className="w-full border-b mt-4 py-1"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />

          <p className="mt-6 mb-2">Choose profession</p>

          <div className="flex flex-wrap gap-2">
            {professions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProfession(p)}
                className={`px-3 py-1 text-sm rounded-full ${
                  profession === p ? "bg-black text-white" : "bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-red-500 text-xs mt-3">{errorMsg}</p>
          )}

          <button
            onClick={handleSignupStep2}
            disabled={loading}
            className="bg-black text-white rounded-full py-2 mt-6 w-full"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <button
            onClick={() => setStep(1)}
            className="mt-4 text-sm underline text-center w-full"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}