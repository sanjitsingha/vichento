"use client";
import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import GoogleSignInButton from "../components/GoogleSignInButton";
import AuthShell, { LegalNote, optionButtonClass } from "../components/AuthShell";

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back."
      footer={
        <>
          <p className="text-sm text-black">
            No account?{" "}
            <Link href="/signup" className="font-medium underline underline-offset-2">
              Create one
            </Link>
          </p>
          <p className="mt-3 text-sm text-black/60">
            Forgot email or trouble signing in?{" "}
            <Link href="/forgot-password" className="underline underline-offset-2 hover:text-black">
              Get help
            </Link>
          </p>
          <LegalNote action="Sign in" />
        </>
      }
    >
      <div className="space-y-3">
        <GoogleSignInButton label="Sign in with Google" />
        <Link href="/signin/email" className={optionButtonClass}>
          <EnvelopeIcon className="size-5" />
          Sign in with email
        </Link>
      </div>
    </AuthShell>
  );
}
