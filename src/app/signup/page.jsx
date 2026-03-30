"use client";
import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import GoogleSignInButton from "../components/GoogleSignInButton";
import Image from "next/image";

export default function SignUpOptions() {
  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6">
      <Image width={60} height={60} alt="logo" src={'/logo.png'}/>
      <h1 className="text-xl text-black font-creato tracking-tight my-10">Vichento - Read. Write. Think deeper. </h1>

      <GoogleSignInButton />
      <Link
        href="/signup/email"
        className="border w-[280px] py-2 mt-3 text-black rounded-full text-center flex items-center justify-center gap-2"
      >
        <EnvelopeIcon className="size-5" />
        Sign up with email
      </Link>

      <p className="text-sm text-black mt-6">
        Already have an account?{" "}
        <Link href="/signin" className="underline">
          Sign in
        </Link>
      </p>
      <p className="text-[12px] text-center  text-black/60 mt-6">
        By clicking "Sign up", you accept Vichento's Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}
