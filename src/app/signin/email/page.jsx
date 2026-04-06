"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function EmailLogin() {
  const router = useRouter();

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
      // ✅ Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) throw error;

      // ✅ No need setUser — Supabase handles session
      router.push("/");
    } catch (error) {
      setErrorMsg("Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6">
      <Image width={60} height={60} alt="logo" src={"/logo.png"} />

      <h1 className="text-2xl text-black font-creato tracking-tight my-10">
        Sign in with email
      </h1>

      <form
        className="w-full max-w-[300px] flex flex-col"
        onSubmit={handleLogin}
      >
        {/* EMAIL */}
        <label className="text-xs text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-b py-1 outline-none text-black"
          required
        />

        {/* PASSWORD */}
        <label className="text-xs mt-6 text-gray-700">Password</label>

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="border-b py-1 outline-none w-full text-black"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
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
          <div className="bg-red-100 p-2 mt-6 border rounded">
            <p className="text-xs text-red-500">{errorMsg}</p>
          </div>
        )}

        {/* BUTTON */}
        <button
          disabled={loading}
          className="bg-black text-white rounded-full py-2 mt-10"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <Link href="/signin" className="mt-4 text-black/50 underline text-sm">
        Go back
      </Link>

      <Link href="/forgot-password" className="mt-4 text-black/50 text-sm">
        Having problem logging in?
      </Link>
    </div>
  );
}