"use client";
import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import GoogleSignInButton from "../components/GoogleSignInButton";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6">
<Image width={60} height={60} alt="logo" src={'/logo.png'}/>
      <h1 className="text-3xl my-10 text-black font-creato tracking-tight">welcome back.</h1>

      <GoogleSignInButton />

      {/* Email */}
      <Link
        href="/signin/email"
        className="border mt-3 w-[280px] py-2 text-black rounded-full text-center flex items-center justify-center gap-2"
      >
        <EnvelopeIcon className="size-5" />
        Sign in with email
      </Link>

      <p className="text-sm text-black mt-6">
        No account?{" "}
        <Link href="/signup" className="underline">
          Create one
        </Link>
      </p>

      <p className="text-[12px] text-center  text-black/60 mt-6">
        By clicking "Sign in", you accept Vichento's Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}
