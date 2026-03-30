"use client";

import { useState } from "react";
import Link from "next/link";
import { account } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function EmailLogin() {
  const router = useRouter();
  const { setUser } = useAuthContext();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const session = await account.createEmailPasswordSession({
        email,
        password: pass,
      });

      setUser(session.user);
      router.push("/");
    } catch (error) {
      setErrorMsg("Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6">
      <Image width={60} height={60} alt="logo" src={'/logo.png'}/>
      <h1 className="text-2xl text-black font-creato tracking-tight my-10">Sign in with email</h1>

      <form
        className="w-full max-w-[300px] flex flex-col"
        onSubmit={handleLogin}
      >
        {/* EMAIL INPUT */}
        <label className='block text-xs font-medium  text-gray-700' htmlFor='email'>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="placeholder:text-xs w-full text-black placeholder:text-gray-500 placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1 "
          required
        />

        {/* PASSWORD INPUT WITH EYE ICON */}
          <label className='block text-xs font-medium mt-6 text-gray-700' htmlFor='password'>Password</label>
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="placeholder:text-xs w-full text-black placeholder:text-black placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1 "
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 cursor-pointer top-1/2 -translate-y-1/2 text-gray-600"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* ERROR MESSAGE */}
         {errorMsg && (
            <div className="w-full bg-red-100 p-2 border border-red-300 rounded-sm mt-6">
              <p className="text-xs text-red-500">{errorMsg}</p>
            </div>
          )}

        {/* SUBMIT BUTTON */}
        <button
          disabled={loading}
          className="bg-black cursor-pointer text-white rounded-full py-2 mt-10 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <Link href="/signin" className="mt-4 text-black/50 underline text-sm">
        Go back
      </Link>
      <Link href="/forgot-password" className="mt-4 text-black/50  text-sm">
        Having problem logging in?
      </Link>
    </div>
  );
}
