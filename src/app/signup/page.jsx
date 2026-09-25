"use client";
import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import GoogleSignInButton from "../components/GoogleSignInButton";
import AuthShell, { LegalNote, optionButtonClass } from "../components/AuthShell";

export default function SignUpOptions() {
  return (
    <AuthShell
      title="Join Vichento."
      subtitle="Read. Write. Think deeper."
      footer={
        <>
          <p className="text-sm text-black">
            Already have an account?{" "}
            <Link href="/signin" className="font-medium underline underline-offset-2">
              Sign in
            </Link>
          </p>
          <LegalNote action="Sign up" />
        </>
      }
    >
      <div className="space-y-3">
        <GoogleSignInButton label="Sign up with Google" />
        <Link href="/signup/email" className={optionButtonClass}>
          <EnvelopeIcon className="size-5" />
          Sign up with email
        </Link>
      </div>
    </AuthShell>
  );
}
