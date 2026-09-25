"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

/** Shared centred layout for sign-in / sign-up / password pages. */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  redirectIfAuthed = true,
}) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (redirectIfAuthed && !loading && user) router.replace(getNextPath());
  }, [redirectIfAuthed, loading, user, router]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[340px] animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Vichento home">
            <Image width={52} height={52} alt="" src="/logo.png" priority />
          </Link>
          <h1 className="mt-8 font-creato text-[28px] tracking-tight text-black">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-black/60">{subtitle}</p>
          )}
        </div>

        <div className="mt-10">{children}</div>

        {footer && <div className="mt-8 text-center">{footer}</div>}
      </div>
    </div>
  );
}

export function LegalNote({ action = "Sign in" }) {
  return (
    <p className="mt-8 text-center text-[12px] leading-relaxed text-black/50">
      By clicking &quot;{action}&quot;, you accept Vichento&apos;s{" "}
      <Link href="/terms-and-conditions" className="underline hover:text-black">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy-policy" className="underline hover:text-black">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
      {children}
    </p>
  );
}

export const inputClass =
  "w-full border-b border-gray-300 bg-transparent py-1.5 text-black outline-none transition-colors placeholder:text-gray-400 focus:border-black";

export const primaryButtonClass =
  "w-full rounded-full bg-black py-2.5 text-sm text-white transition-colors hover:bg-gray-800 disabled:opacity-50";

export const optionButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-full border border-gray-800 py-2.5 text-[15px] text-black transition-colors hover:bg-gray-50";

/** Only allow same-site relative redirects. */
export function getNextPath(fallback = "/") {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
