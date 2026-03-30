"use client";

import { useState } from "react";
import Link from "next/link";
import { account, ID } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

// profession options

const AVATARS = [
  "69c3b1190013e1c34def",
  "69c3b11400366576f43f",
  "69c3b1100001e28a6f53",
  "69c3b10b0017652ee857",
  "69c3b105001867b3414e",
  "69c3b0ff00156e6886a7",
  "69c3b0f60016e5e370cd",
  "69c3b0f00026e0b5d9e5",
  "69c3b0e3002d6b4bc943",
  "69c3b0de0017064e0a1e",
  "69c3b0ce003aecbf2faa",
  "69c3b0b90038fc4c6a8d",
]
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


const getRandomAvatar = () => {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
};
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
    setErrorMsg("");

    // Password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!passwordRegex.test(pass)) {
      return setErrorMsg(
        "Password must be at least 6 characters and include a letter, number, and special character."
      );
    }

    // Email basic check
    if (!email) {
      return setErrorMsg("Please enter a valid email.");
    }

    // Move to next step
    setStep(2);
  };

  // STEP 2 → Save profile preferences
  const handleSignupStep2 = async () => {
    setLoading(true);
    setErrorMsg("");

    if (!name || !dob || !profession) {
      setLoading(false);
      return setErrorMsg("Please fill all fields.");
    }

    try {
      // ✅ Create account
      await account.create({
        userId: ID.unique(),
        email,
        password: pass,
        name,
      });


      // ✅ Login
      const session = await account.createEmailPasswordSession({
        email,
        password: pass,
      });
      await account.createVerification(
        "http://localhost:3000/verify-email"
      );
      setUser(session.user);


      // ✅ Assign RANDOM avatar (fileId)
      const selectedAvatar = getRandomAvatar();

      // ✅ Save prefs
      await account.updatePrefs({
        dob,
        profession,
        avatar: selectedAvatar,
      });

      router.push("/");
      // router.push("/verify-email");
    } catch (error) {
      setErrorMsg(error.message);
    }

    setLoading(false);
  };
  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6">
      {/* --------------------- STEP 1 UI --------------------- */}
      {step === 1 && (
        <>
            <Image width={60} height={60} alt="logo" src={'/logo.png'}/>
          <h1 className='text-2xl mt-10 text-black font-creato  tracking-tight align-start'>Create your account</h1>
          <p className='text-sm mt-2 text-black/60 text-center mb-10'>It only takes a moment to get started with your account.</p>

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
              className="font-semibold placeholder:text-gray-500 text-black placeholder:text-xs placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1  "
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
                className="font-semibold placeholder:text-xs w-full text-black placeholder:text-gray-500 placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1 "
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer "
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
              <div className="w-full bg-red-100 p-2 border border-red-300 rounded-sm mt-4">
                <p className="text-xs text-red-500">{errorMsg}</p>
              </div>
            )}


            {/* NEXT BUTTON */}
            <button
              disabled={loading}
              className="bg-black text-white rounded-full cursor-pointer  py-2 mt-8 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Please wait..." : "Next →"}
            </button>
          </form>

          <Link href="/signup" className="mt-6 text-black/50  cursor-pointer underline text-sm">
            Go back
          </Link>
        </>
      )}

      {/* --------------------- STEP 2 UI --------------------- */}
      {step === 2 && (
        <div className="w-full max-w-[300px]">
          <h1 className="text-xl font-creato text-black tracking-tight  text-center">Tell us about you</h1>
          <label className='block text-xs font-medium mt-10 text-gray-700' htmlFor='name'>Full Name</label>
          <input
            type="text"

            className=" w-full text-black border-b border-gray-300 focus:border-b-black outline-none py-1 "
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className='block text-xs font-medium mt-4 text-gray-700' htmlFor='dob'>Date of Birth</label>
          <input
            type="date"
            className="placeholder:text-xs w-full text-black placeholder:text-gray-500 placeholder:font-medium border-b border-gray-300 k outline-none py-1 "
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />

          <p className="mb-2 mt-6 text-gray-600">Choose your profession</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {professions.map((p) => (
              <button
                key={p}
                type="button"
                className={`px-3 py-1 text-sm rounded-full border ${profession === p
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
                  }`}
                onClick={() => setProfession(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* ERROR */}
          {errorMsg && (
            <div className="w-full bg-red-100 p-2 border border-red-300 rounded-sm mt-4">
              <p className="text-xs text-red-500">{errorMsg}</p>
            </div>
          )}
          <button
            onClick={handleSignupStep2}
            disabled={loading}
            className="bg-black cursor-pointer text-white rounded-full py-2 mt-4 w-full disabled:opacity-60"
          >
            {loading ? "Saving..." : "Create Account"}
          </button>

          <button
            onClick={() => setStep(1)}
            className="mt-4 text-black/50 underline block cursor-pointer mx-auto text-sm"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}
