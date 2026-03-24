"use client";

import { useState } from "react";
import Link from "next/link";
import { account, ID } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// profession options
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

export default function EmailSignup() {
  const router = useRouter();
  const { setUser } = useAuthContext();

  const [step, setStep] = useState(1);

  // Step 1 fields
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 fields
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [profession, setProfession] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // STEP 1 → Create user
  const handleSignupStep1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await account.create({
        userId: ID.unique(),
        email,
        password: pass,
      });

      const session = await account.createEmailPasswordSession({
        email,
        password: pass,
      });

      setUser(session.user);

      setStep(2);
    } catch (error) {
      setErrorMsg(error.message);
    }

    setLoading(false);
  };

  // STEP 2 → Save profile preferences
  const handleSignupStep2 = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      await account.updateName(name);
      await account.updatePrefs({ dob, profession });

      router.push("/");
    } catch (error) {
      setErrorMsg(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center px-6">
      {/* --------------------- STEP 1 UI --------------------- */}
      {step === 1 && (
        <>
          <h1 className='text-3xl font-semibold tracking-tighter mb-6 align-start'>Create your account</h1>

          <form
            className="w-full max-w-[300px] flex flex-col"
            onSubmit={handleSignupStep1}
          >
            <label className='block text-xs font-medium mt-4 text-gray-700' htmlFor='email'>Email</label>
            {/* EMAIL */}
            <input
              type="email"
              placeholder="johndoe@hotmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-semibold placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1  "
              required
            />
            

            {/* PASSWORD WITH EYE ICON */}
            <div className="relative w-full mt-4 mb-3">
              <label className='block text-xs font-medium mt-4 text-gray-700' htmlFor='password'>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="123***"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="font-semibold placeholder:text-xs w-full placeholder:text-gray-500 placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1 "
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* ERROR */}
            {errorMsg && (
              <p className="text-red-500 text-sm mb-3 text-center">
                {errorMsg}
              </p>
            )}

            {/* NEXT BUTTON */}
            <button
              disabled={loading}
              className="bg-black text-white rounded-full py-2 mt-8 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Please wait..." : "Next →"}
            </button>
          </form>

          <Link href="/signup" className="mt-6 underline text-sm">
            Go back
          </Link>
        </>
      )}

      {/* --------------------- STEP 2 UI --------------------- */}
      {step === 2 && (
        <div className="w-full max-w-[300px]">
          <h1 className="text-2xl mb-6 text-center">Tell us about you</h1>

          <input
            type="text"
            placeholder="Full Name"
            className="bg-gray-200 text-[14px] focus:border outline-none rounded-sm px-3 py-2 mb-3 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="date"
            className="bg-gray-200 text-[14px] focus:border outline-none rounded-sm px-3 py-2 mb-3 w-full"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />

          <p className="mb-2 text-gray-600">Choose your profession</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {professions.map((p) => (
              <button
                key={p}
                type="button"
                className={`px-3 py-1 rounded-full border ${
                  profession === p
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setProfession(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-red-500 text-sm mb-3 text-center">{errorMsg}</p>
          )}

          <button
            onClick={handleSignupStep2}
            disabled={loading}
            className="bg-black text-white rounded-full py-2 w-full disabled:opacity-60"
          >
            {loading ? "Saving..." : "Create Account"}
          </button>

          <button
            onClick={() => setStep(1)}
            className="mt-4 underline block mx-auto text-sm"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}
